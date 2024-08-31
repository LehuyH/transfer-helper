"use client";

import { DataSchool, getMajor, LAST_UPDATED } from "~/lib/data";
import { PlanCollegePicker } from "./plan-college-picker";
import { Button } from "../ui/button";
import { ChevronsUpDown, Lasso, MessageCircleWarning, XIcon } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "../ui/card";
import { PickerWithGroups } from "../ui/picker";
import { Label } from "../ui/label";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "../ui/collapsible";
import { Badge } from "../ui/badge";
import { Alert, AlertDescription, AlertTitle } from "../ui/alert";
import { useQueries, QueryClient, QueryClientProvider } from "@tanstack/react-query"
import { useLocalStorage } from "~/lib/hooks/useLocalStorage";
import { useAutoAnimate } from '@formkit/auto-animate/react'
import { Group } from "~/lib/classes";



interface Props {
    transferColleges: Map<number, DataSchool & { majors: string[] }>
    communityColleges: Map<number, DataSchool>
    homeID: number
}

const queryClient = new QueryClient();

export function PlanInner({ transferColleges, homeID, communityColleges }: Props) {
    const [selectedTransferColleges, setSelectedTransferColleges] = useLocalStorage<Record<string, boolean>>(
        `${homeID}-${LAST_UPDATED}-transferColleges`,()=>({})
    )
    const [selectedMajors, setSelectedMajors] = useLocalStorage<Record<string, {
        transferCollegeID: number,
        value: string,
    }>>(`${homeID}-${LAST_UPDATED}-majors`,()=>({}))

    const [animationParent] = useAutoAnimate()


    const selectedMajorSet = Object.keys(selectedMajors)

    const selectedColleges = Object.entries(selectedTransferColleges)
        .filter(([_, v]) => v)
        .map(([k, _]) => k)

    const optionsTransferFiltered = new Map([
        ...transferColleges
    ])
    selectedColleges.forEach(v => optionsTransferFiltered.delete(Number(v)))

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

    const majorQueries = useQueries({
        queries: Object.values(selectedMajors).map(sm => {
            const [name] = sm.value.split("[SPLIT]")
            const queryKey = [homeID, sm.transferCollegeID, LAST_UPDATED, name]
            return {
                queryKey,
                queryFn: () => getMajor({
                    from: homeID,
                    to: sm.transferCollegeID,
                    major: name!
                }),
                retry: (retryCount:number, error:any)=>{
                    if(error.status === 403) return false;
                    return retryCount < 3;  
                }
            }

        })
    })

    const majorAgreementsParsed = majorQueries.flatMap(a=>{
        if(a.data){
            return Object.entries(a.data.groups).flatMap(([k,v])=>v.map(v=>new Group(k,v)))
        }else{
            return null
        }
    })

    return (
        <>
            <div>
             
            </div>
            <div className="p-2 w-full max-w-6xl mx-auto space-y-12">
                <div className="md:grid grid-cols-2 gap-4 w-full space-y-4 md:space-y-0">
                    <Card>
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
                    <Card>
                        <CardHeader>
                            <CardTitle>
                                The Majors I Want Are...
                            </CardTitle>
                            <CardDescription>
                                {selectedColleges.length} majors(s) selected
                            </CardDescription>
                        </CardHeader>
                        <CardContent>
                            <aside className="space-y-2 max-w-[80vw]">
                                <PickerWithGroups
                                    cta="Add a major"
                                    options={majorOptions}
                                    onSelect={(id) => {
                                        setSelectedMajors({
                                            ...selectedMajors,
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
                                        Object.entries(selectedMajors).map(([key, major]) => {
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
                    (selectedMajorSet.length === 0) ?
                        <div className="text-center py-12">
                            <Label>Select a Transfer College and Major to begin ☝️</Label>
                        </div>

                        :
                        <>

                            <Alert className="items-center">
                                <MessageCircleWarning />
                                <AlertTitle>Pending Requirements</AlertTitle>
                                <AlertDescription>
                                    Complete the questions at the bottom of this page to get the most accurate recommendations
                                </AlertDescription>
                            </Alert>
                            <section className="space-y-4">
                                <h1 className="font-bold md:text-2xl text-xl">
                                    Requirements
                                </h1>
                                <div>
                                    <Collapsible>
                                        <Card className="inline-block">
                                            <CardHeader>
                                                <CardTitle className="flex items-center gap-4">
                                                    <p>Intro To Fortnite (G1A)</p>
                                                    <Badge>
                                                        6 Units
                                                    </Badge>
                                                    <div>
                                                        <CollapsibleTrigger asChild>
                                                            <Button variant="secondary" size="tiny" Icon={ChevronsUpDown} />
                                                        </CollapsibleTrigger>
                                                    </div>
                                                </CardTitle>
                                            </CardHeader>
                                            <CollapsibleContent>
                                                <CardContent>
                                                    <CardDescription>
                                                        Hello
                                                    </CardDescription>
                                                </CardContent>
                                            </CollapsibleContent>
                                        </Card>
                                    </Collapsible>
                                </div>

                            </section>

                        </>

                }




            </div>
        </>
    )
}

export function Plan(props:Props){
    return (
        <QueryClientProvider client={queryClient}>
            <PlanInner {...props}/>
        </QueryClientProvider>
    )
}