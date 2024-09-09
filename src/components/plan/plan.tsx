"use client";

import { DataSchool, getMajor, LAST_UPDATED } from "~/lib/data";
import { PlanCollegePicker } from "./plan-college-picker";
import { Button } from "../ui/button";
import { AlertCircle, CheckIcon, Download, LinkIcon, StarIcon, XIcon } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "../ui/card";
import { PickerWithGroups } from "../ui/picker";
import { Label } from "../ui/label";
import { Alert, AlertDescription, AlertTitle } from "../ui/alert";
import { useQueries, QueryClient, QueryClientProvider } from "@tanstack/react-query"
import { useLocalStorage } from "~/lib/hooks/useLocalStorage";
import { useAutoAnimate } from '@formkit/auto-animate/react'
import { Group, FulfillmentProps } from "~/lib/classes";
import { PlanGroup } from "./plan-group";
import { useState } from "react";
import { PlanClassTable } from "./plan-class-table";
import { PlanFinished } from "./plan-finished";




interface Props {
    transferColleges: Map<number, DataSchool & { majors: string[] }>
    communityColleges: Map<number, DataSchool>
    homeID: number
}

const queryClient = new QueryClient();

export function PlanInner({ transferColleges, homeID, communityColleges }: Props) {
    const [animationParent] = useAutoAnimate()
    const home = communityColleges.get(homeID)!

    //STATE
    const [selectedTransferColleges, setSelectedTransferColleges] = useLocalStorage<Record<string, boolean>>(
        `${homeID}-${LAST_UPDATED}-transferColleges`, () => ({})
    )
    const [selectedMajors, setSelectedMajors] = useLocalStorage<Record<string, {
        transferCollegeID: number,
        value: string,
    }>>(`${homeID}-${LAST_UPDATED}-majors`, () => ({}))


    const [userFromClassesTaken, setUserFromClassesTaken] = useLocalStorage<FulfillmentProps["fromClassesTaken"]>(
        `${homeID}-${LAST_UPDATED}-userFromClassesTaken`, () => ({})
    )
    const [numClassesUsed, setNumClassesUsed] = useState<FulfillmentProps["numClassesUsed"]>(new Map())

    //COMPUTED
    const selectedMajorSet = Object.keys(selectedMajors)
    const selectedColleges = Object.entries(selectedTransferColleges)
        .filter(([_, v]) => v)
        .map(([k, _]) => k)

    const optionsTransferFiltered = new Map([
        ...transferColleges
    ])

    //CLEANUP
    selectedColleges.forEach(v => optionsTransferFiltered.delete(Number(v)))
    const majorsFiltered = Object.fromEntries(
        Object.entries(selectedMajors).filter(([_, v]) => selectedColleges.includes(v.transferCollegeID.toString()))
    )

    Object.entries(userFromClassesTaken).forEach(([k, v]) => {
        const current = Object.keys(majorsFiltered).map(v => {
            const [major, id] = v.split("[SPLIT]")
            const college = transferColleges.get(Number(id))
            return `${college!.name}: ${major}`
        })
        if (!v.requiredBy.some(v => current.includes(v))) {
            delete userFromClassesTaken[k]
        }
    })

    const majorOptions = selectedColleges.map(id => {
        const college = transferColleges.get(Number(id))!
        const optionsUnique = Array.from(college.majors)
        return {
            label: college.name,
            options: optionsUnique.map(m => ({
                label: m,
                value: m + "[SPLIT]" + id
            })).filter(m => !selectedMajorSet.includes(m.value))
        }
    })

    //Network fetches
    const majorQueries = useQueries({
        queries: Object.values(majorsFiltered).map(sm => {
            const [name] = sm.value.split("[SPLIT]")
            const queryKey = [homeID, sm.transferCollegeID, LAST_UPDATED, name]
            return {
                queryKey,
                queryFn: () => getMajor({
                    from: homeID,
                    to: sm.transferCollegeID,
                    major: name!
                }),
                retry: (retryCount: number, error: any) => {
                    if (error.status === 403) return false;
                    return retryCount < 3;
                }
            }

        })
    })

    const allQueriesDone = majorQueries.every(a => a.isPending === false)

    const agreements = new Map() as FulfillmentProps["agreements"]
    const fromClassesTaken = {} as FulfillmentProps["fromClassesTaken"]
    const majorGroupNameMap = new Map<string, number>()
    const majorAgreementsParsed = majorQueries.flatMap((a, i) => {
        if (a.data) {
            const inputData = Object.values(majorsFiltered)[i]!
            const [major, id] = inputData.value.split("[SPLIT]")
            const collegeName = transferColleges.get(Number(id))!.name
            a.data.agreements.forEach(agreement => {
                agreements.set(agreement.templateCellId, {
                    ...agreement,
                    major: `${collegeName}: ${major}`
                })
            })

            //Cleanup null objects in group courses
            Object.keys(a.data.groups).forEach(key => {
                const groups = a.data.groups[key]
                groups?.forEach(group => {
                    group.sections.forEach(section => {
                        section.agreements.forEach(agreement => {
                           
                            agreement.courses = agreement.courses.map(c =>{
                                if(!c.courses) c.courses = []
                                return ({
                                    ...c,
                                    courses: c.courses.filter(c => c)
                                })
                            })
                        })
                    })
                })
            })


            return Object.entries(a.data.groups).flatMap(([k, v]) => v.map(v => new Group(k, v, collegeName, major!)))
        } else {
            return null
        }
    }).filter(g => g) as Group[]

    //Ensure unique name
    majorAgreementsParsed.forEach(g => {
        if (!g) return;
        const name = g.data.name
        if (majorGroupNameMap.has(name)) {
            const id = majorGroupNameMap.get(name)!
            majorGroupNameMap.set(name, id + 1)
            g.data.name = g!.data.name + ` (${id + 1})`
        } else {
            majorGroupNameMap.set(name, 0)
        }

    })

    //Prefill from classes taken based on clear requirements
    majorAgreementsParsed.forEach(g => {
        const templateCellIds = g.getRequiredCellIDs().concat(g.getSmartPickCellIDs(agreements));
        templateCellIds.forEach(id => {
            const agreement = agreements.get(id)

            if (agreement) {
                const hasClearOption = agreement.articulation.sendingArticulation.pickOneGroup.length === 1
                if (hasClearOption) {
                    agreement.articulation.sendingArticulation.pickOneGroup[0]?.fromClasses.forEach(c => {
                        if (!fromClassesTaken[c.courseIdentifierParentId]) {
                            fromClassesTaken[c.courseIdentifierParentId] = {
                                ...c,
                                requiredBy: []
                            }
                        }
                        fromClassesTaken[c.courseIdentifierParentId]!.requiredBy.push(`${g.schoolName}: ${g.majorName}`)
                    })
                }
            }
        })
    })
    const fufilment: FulfillmentProps = {
        fromClassesTaken: {
            ...userFromClassesTaken,
            ...fromClassesTaken
        },
        numClassesUsed: numClassesUsed,
        agreements: agreements
    }

    let groupsToDisplay = majorAgreementsParsed.filter(g => g.required === 'REQUIRED')
    if (groupsToDisplay.length === 0) groupsToDisplay = majorAgreementsParsed

    const inProgress = (groupsToDisplay.some(g => !g.isFufilled(fufilment)?.fufilled))

    return (
        <div className="p-2 px-6 w-full max-w-6xl mx-auto space-y-12" ref={animationParent}>
            <h1 className="md:text-3xl font-bold text-xl">
                {home.name} Transfer Planner
            </h1>
            <div className="md:grid grid-cols-2 gap-4 w-full space-y-4 md:space-y-0">
                <Card className="max-w-[90vw]">
                    <CardHeader>
                        <CardTitle>
                            I Want To Transfer To...
                        </CardTitle>
                        <CardDescription>
                            {selectedColleges.length} college(s) selected
                        </CardDescription>
                    </CardHeader>
                    <CardContent>
                        <aside className="space-y-2 max-w-[80vw]">
                            <PlanCollegePicker
                                onSelect={(id) => {
                                    if (!selectedTransferColleges[id]) {
                                        setSelectedTransferColleges({
                                            ...selectedTransferColleges,
                                            [id]: true
                                        })
                                    } else {
                                        setSelectedTransferColleges({
                                            ...selectedTransferColleges,
                                            [id]: !selectedTransferColleges[id]
                                        })
                                    }
                                }
                                }
                                transferColleges={optionsTransferFiltered} />
                            <div ref={animationParent} className="flex flex-wrap overflow-y-auto gap-2 text-sm">
                                {
                                    selectedColleges.map((n) => {
                                        const college = transferColleges.get(Number(n))
                                        return (
                                            <Button key={n} onClick={(e) => setSelectedTransferColleges((prev) => {
                                                const copy = { ...prev }
                                                delete copy[n]
                                                return copy;
                                            })} size="tiny" variant="secondary" Icon={XIcon}>
                                                {college?.name}
                                            </Button>
                                        )
                                    })
                                }
                            </div>
                        </aside>
                    </CardContent>
                </Card>
                <Card className="max-w-[90vw]">
                    <CardHeader>
                        <CardTitle>
                            The Majors I Want Are...
                        </CardTitle>
                        <CardDescription>
                            {Object.keys(majorsFiltered).length} majors(s) selected
                        </CardDescription>
                    </CardHeader>
                    <CardContent>
                        <aside className="space-y-2 max-w-[80vw]">
                            <PickerWithGroups
                                cta="Add a major"
                                options={majorOptions}
                                onSelect={(id) => {
                                    setSelectedMajors({
                                        ...majorsFiltered,
                                        [id]: {
                                            transferCollegeID: Number(id.split("[SPLIT]")[1]),
                                            value: id
                                        }
                                    })
                                }
                                }
                            />
                            <div ref={animationParent} className="flex flex-wrap overflow-y-auto gap-2 text-sm">
                                {
                                    Object.entries(majorsFiltered).map(([key, major]) => {
                                        const [majorName, collegeID] = key.split("[SPLIT]")
                                        const college = transferColleges.get(Number(collegeID))!.code
                                        return (
                                            <Button key={key} onClick={(e) => setSelectedMajors((prev) => {
                                                const copy = { ...prev }
                                                delete copy[key]
                                                return copy;
                                            })} size="tiny" variant="secondary" Icon={XIcon}>
                                                {majorName} ({college})
                                            </Button>
                                        )
                                    })
                                }
                            </div>

                        </aside>
                    </CardContent>
                </Card>

            </div>


            {
                (Object.keys(majorsFiltered).length === 0) ?
                    <div className="text-center py-12">
                        <Label>Select a Transfer College and Major to begin ☝️</Label>
                    </div>

                    :
                    <div className="space-y-12">

                        <section className="space-y-4" id="plan" ref={animationParent}>
                            <h1 id="plan-class-table" className="font-bold md:text-2xl text-xl">
                                Requirements
                            </h1>
                            {
                                (inProgress || !allQueriesDone) ?

                                    <Alert className="items-center max-w-[90vw]">
                                        <AlertCircle />
                                        <AlertTitle>This list is INCOMPLETE</AlertTitle>
                                        <AlertDescription>
                                            Complete the questions at the bottom of this page to get the most accurate recommendations
                                        </AlertDescription>
                                    </Alert>

                                    :
                                    <>
                                        <PlanFinished homeCollege={home.name} />

                                        <Alert className="items-center max-w-[90vw]">
                                            <CheckIcon />
                                            <AlertTitle>Your Plan Is (Almost) Ready!</AlertTitle>
                                            <AlertDescription>
                                                <b>THIS IS NOT A REPLACEMENT FOR A COLLEGE COUNSELOR</b>
                                                <br /><br />
                                                While this tool attempts to find all the requirements for your goals, we HIGHLY suggest manually validaiting this plan with ASSIST.org and a college counselor to make sure you are on the right track.
                                                <aside className="flex flex-wrap gap-2 pt-4">
                                                    <Button variant="link" Icon={LinkIcon}>
                                                        Review ASSIST.org
                                                    </Button>
                                                    <Button variant="link"
                                                        onClick={() => {
                                                            const url = `https://www.google.com/search?btnI=1&q=${encodeURIComponent(home.name + ' counseling')}`
                                                            window.open(url, '_blank')
                                                        }}
                                                        Icon={LinkIcon}>
                                                        Create Appointment with College Counselor
                                                    </Button>

                                                    <Button variant="link" Icon={StarIcon}>
                                                        <a href="https://studykit.app" target="_blank">
                                                            Free Study Tools (also made by me)
                                                        </a>
                                                    </Button>

                                                    <Button className="w-full" variant="default" Icon={Download} onClick={(e) => {
                                                        const header = ["Course Code", "Course Title", "Units", "Required By"]
                                                        const data = Object.values(fufilment.fromClassesTaken).map(c => {
                                                            const course = `${c.prefix}${c.courseNumber}`
                                                            return [course, c.courseTitle, c.maxUnits, `(${c.requiredBy.length}) ` + c.requiredBy.join(", ")] as [string, string, number, string]

                                                        })
                                                            .sort((a, b) => b[3].localeCompare(a[3]))

                                                        const csvContent = header.join(",") + "\n" + (data.map(r => {
                                                            return r.map(c => {
                                                                if (typeof c === 'string') return `"${c}"`
                                                                return c
                                                            }).join(',')
                                                        })).join('\n')

                                                        const csvBlob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' })
                                                        const url = URL.createObjectURL(csvBlob)
                                                        const link = document.createElement('a')
                                                        link.href = url
                                                        link.setAttribute('download', `${home.name}-${LAST_UPDATED}-plan.csv`)
                                                        document.body.appendChild(link)
                                                        link.click()
                                                        document.body.removeChild(link)
                                                        URL.revokeObjectURL(url)
                                                    }}>
                                                        Download Plan
                                                    </Button>
                                                </aside>
                                            </AlertDescription>
                                        </Alert>
                                    </>

                            }

                            <PlanClassTable
                                userSelected={Object.values(userFromClassesTaken)}
                                hardRequirements={Object.values(fromClassesTaken)} />

                        </section>

                        <section className="space-y-4">
                            <h1 className="font-bold md:text-2xl text-xl">
                                Classes To Pick
                            </h1>
                            <div className="space-y-4 relative">
                                {
                                    groupsToDisplay.map(g =>
                                    (

                                        <PlanGroup key={`${g.schoolName}-${g.majorName}-${g.data.name}`}
                                            fulfilment={fufilment} setUserFromClassesTaken={setUserFromClassesTaken}
                                            group={g} />

                                    )
                                    )
                                }
                            </div>
                        </section>

                    </div>

            }




        </div>
    )
}

export function Plan(props: Props) {
    return (
        <QueryClientProvider client={queryClient}>
            <PlanInner {...props} />
        </QueryClientProvider>
    )
}