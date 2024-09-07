import type { Cell, FulfillmentProps, Group, Section } from "~/lib/classes";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "../ui/card";
import { createContext, Dispatch, Fragment, SetStateAction, useContext, useState } from "react";
import { Separator } from "../ui/separator";
import { Avatar, AvatarFallback } from "../ui/avatar";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "../ui/collapsible";
import { AlertCircle, CheckIcon, ChevronDown, ChevronUp } from "lucide-react";
import { Agreement, Course as ICourse } from "@lehuyh/assist-js/types";
import { Button } from "../ui/button";
import { motion, AnimatePresence } from "framer-motion"
import { Alert, AlertDescription, AlertTitle } from "../ui/alert";
import { Badge } from "../ui/badge";
import { Label } from "../ui/label";
import { Checkbox } from "~/components/ui/checkbox"


interface FufilmentContextValue extends FulfillmentProps{
    setUserFromClassesTaken:Dispatch<SetStateAction<FulfillmentProps["fromClassesTaken"]>>
}

const defaultFufilment = {
    fromClassesTaken: {},
    numClassesUsed: new Map(),
    agreements: {},
    setUserFromClassesTaken: null as any
} as FufilmentContextValue 

export const FufilmentContext = createContext<FufilmentContextValue>(defaultFufilment)

export function PlanGroup({ group, fulfilment, setUserFromClassesTaken }: { group: Group, fulfilment: FulfillmentProps, 
    setUserFromClassesTaken: Dispatch<SetStateAction<FulfillmentProps["fromClassesTaken"]>> }) {
    const fufillmentCheck = group.isFufilled(fulfilment)
    return (
        <Card className="max-w-[90vw]">
            <CardHeader>
                <CardTitle>
                    {group.data.name}
                </CardTitle>
                <CardDescription>
                    {
                        (group.schoolName + " | " + group.majorName)
                    }

                </CardDescription>
            </CardHeader>
            <CardContent>
                <h2 className="md:text-xl text-lg font-thin tracking-tight">
                    {
                        (group.instruction.pick) ?
                            <>
                                Pick {group.instruction.pick.amount} {group.instruction.pick.type.toLowerCase()}({
                                    (group.instruction.pick.type.toLowerCase().endsWith("s") ? "es" : "s")
                                }) from
                            </>
                            : <>
                                Complete
                            </>
                    }
                    {
                        (" " + group.sections.map(s => s.letter).join(` ${group.instruction.type.toLowerCase()} `))
                    }
                    {
                        (group.instruction.area) ? 
                        <>
                            <br />
                            With {group.instruction.area.amount} {
                            group.instruction.area.type.toLowerCase()
                            }
                            {
                                (group.instruction.area.type.toLowerCase().endsWith("s")) ? "(es) " : "(s) "
                            }
                            in {group.instruction.area.sectionCount} different sections
                        </> : <>    </>
                    }
                    {
                        (group.instruction.additional) ? 
                        <>
                            <br />
                            With at least {group.instruction.additional.amount} {
                            group.instruction.additional.type.toLowerCase()
                            }
                            {
                                (group.instruction.additional.type.toLowerCase().endsWith("s")) ? "(es) " : "(s) "
                            }
                            in total
                        </> : <>    </>
                    }
                </h2>
                <aside className="flex flex-wrap gap-2">
                    {
                        (fufillmentCheck.messages.length > 0) && (
                            fufillmentCheck.messages.map(m=><Badge variant="destructive" key={m}>{m}</Badge>)
                        )
                    }
                </aside>
                <FufilmentContext.Provider value={{
                    ...fulfilment,
                    setUserFromClassesTaken
                }}>
                    {
                        group.sections.map((s, i) => {
                            return (
                                <Fragment key={s.letter}>
                                    <PlanSection groupHasInstruction={group.instruction.pick !== undefined || group.instruction.type === 'Or'} key={s.letter} section={s} />
                                    {(i !== group.sections.length - 1) && <Separator />}
                                </Fragment>
                            )
                        })
                    }
                </FufilmentContext.Provider>

            </CardContent>
        </Card>
    )

}


function PlanSection({ section, groupHasInstruction }: { section: Section, groupHasInstruction: boolean }) {
    const fufilment = useContext(FufilmentContext)
    const readyCheck = section.readyCheck(fufilment)
    const fufilmentCheck = section.isFufilled(fufilment)
    const fuilled = fufilmentCheck.fufilled && ( !groupHasInstruction || fufilmentCheck.classes > 0) && readyCheck.ready
    return (
        <div className="py-4 md:flex items-start gap-12">
            <Avatar className="mb-2 md:mb-0 md:translate-x-0 -translate-x-1">
                <AvatarFallback className={
                    (fuilled) ? "bg-green-600 text-white" : ""
                }>{section.letter}</AvatarFallback>
            </Avatar>

            <div className="flex flex-col space-y-6 w-full">
                {
                    (section.instruction.pick) && 
                    <Alert>
                        {
                            (fuilled) ? <CheckIcon className="text-green-500 shrink-0"/> : <AlertCircle/>
                        }
                        <AlertTitle>{
                            (section.instruction.pick)
                                ? `Pick a total of ${section.instruction.pick.amount} ${section.instruction.pick.type.toLowerCase()}${section.instruction.pick.type.toLowerCase().endsWith("s") ? "(es)" : "(s)"} from ${section.letter}`
                                : `Complete ${section.letter}`                            
                        }</AlertTitle>
                        <AlertDescription>
                            {(fuilled) ? "You are good to go!" : readyCheck.message}
                        </AlertDescription>
                    </Alert>
                }
                {
                    section.agreements.map((a, i) => {
                        return (
                            <SectionRow key={i} cells={a} hasInstruction={typeof section.instruction.pick !== 'undefined' || groupHasInstruction} />
                        )
                    })
                }
            </div>

        </div>

    )
}

function SectionRow({ cells, hasInstruction }: { cells: Cell[], hasInstruction: boolean }) {
    return (
        <div className="w-full space-y-4">
            {
                cells.map((c) => {
                   return <PlanCell cell={c} key={c.templateCellId} hasInstruction={hasInstruction}/>
                })
            }
        </div>
    )
}

function PlanCell({ cell: c, hasInstruction }: { cell: Cell, hasInstruction: boolean }) {
    const fufilment = useContext(FufilmentContext)
    const agreement = fufilment.agreements.get(c.templateCellId)
    const fufilmentCheck = c.isFufilled(fufilment)
    const noArticulation = !agreement || (agreement?.articulation.sendingArticulation.pickOneGroup?.length === 0)

    const optionSelectedIndex = (fufilmentCheck.fufilled) ? agreement?.articulation.sendingArticulation.pickOneGroup.findIndex(g=>
        g.fromClasses.map(c=>c.courseIdentifierParentId).every(id=>fufilment.fromClassesTaken[id])
    ) : -1

    const onlyOneOption = agreement?.articulation.sendingArticulation.pickOneGroup.length === 1
    const [open, setOpen] = useState(!fufilmentCheck.fufilled && !noArticulation)

    const toggleOption = (courses:ICourse[])=>{
        const shouldRemove = courses.every(c=>fufilment.fromClassesTaken[c.courseIdentifierParentId])
        const fromClasesToRemove = agreement?.articulation.sendingArticulation.pickOneGroup.flatMap(g=>
            g.fromClasses.flatMap(c=>c.courseIdentifierParentId) ?? []
        ) ?? []
        fufilment.setUserFromClassesTaken(prev=>{
            const copy = {...prev}
            fromClasesToRemove.forEach(c=>delete copy[c])
            if(shouldRemove) return copy

            courses.forEach(c=>copy[c.courseIdentifierParentId] = {
                ...c,
                requiredBy:[agreement?.major ?? '']
            })
            return copy
        })
    }

    return (
        <Collapsible open={open} onOpenChange={(o) => setOpen(o)} className="w-full block">
            <aside className={`${noArticulation ? 'opacity-30' : ''} flex flex-wrap gap-4 py-2`}>
                <CollapsibleTrigger asChild>
                    <Button variant="secondary" size="tiny" Icon={(open) ? ChevronUp : ChevronDown} />
                </CollapsibleTrigger>
                <span className="flex items-center gap-2">
                    <Badge variant='outline'>
                        {c.data.courses.reduce((a, b) => a + (b?.maxUnits ?? 0), 0)} Units
                    </Badge>
                    {
                        c.data.courses.map(c=>`${c.prefix}${c.courseNumber} - ${c.courseTitle}`).join(", ")
                    }
                    {
                        fufilmentCheck.fufilled && <CheckIcon className="text-green-500 shrink-0"/>
                    }
                </span>
            </aside>
            <AnimatePresence>
                {open &&
                    (<CollapsibleContent>
                        <motion.div
                            initial={{ opacity: 0, height: 0 }}
                            animate={{ opacity: 1, height: "auto" }}
                        >
                            <Card>
                                <CardHeader>
                                    <CardTitle className="text-base">
                          
                                       {
                                        (noArticulation) ? "No articulated courses" : 
                                                `Pick 1 of the following options`
                                       }
                                    </CardTitle>
                              
                                    <CardDescription className="space-y-2">
                                        <b>{(optionSelectedIndex === -1) && fufilmentCheck.warnings.join("\n")}</b>
                                        <span>
                                            {
                                                (onlyOneOption && !hasInstruction) &&
                                                "You cannot de-select this option as it is required"
                                            }
                                             {  
                                                //@ts-ignore incorrect type
                                                (agreement?.receivingAttributes.courseAttributes?.map(a=>a.content) ?? [])
                                                .concat(agreement?.receivingAttributes.seriesAttributes ?? [])
                                                .concat(agreement?.receivingAttributes.seriesCourseAttributes ?? [])
                                                .concat(agreement?.articulation.courseAttributes ?? [])
                                                .concat(agreement?.articulation.generalAttributes ?? [])
                                                .concat(agreement?.articulation.seriesAttributes ?? [])
                                                .concat(agreement?.articulation.sendingArticulation.generalAttributes ?? [])
                                                .join(', ')
                                           }
                                        </span>
                                        <span>
                                        {
                                           (c.data.type === 'Series') ?
                                            (c.data.generalAttributes ?? []).concat(c.data.seriesAttributes ?? []).join(', ')
                                            : (c.data.generalAttributes ?? []).concat(c.data.courseAttributes ?? []).join(', ')
                                        }
                                        </span>
                                    </CardDescription>
                          
                                </CardHeader>
                                <CardContent>
                                    <div className="flex flex-col flex-wrap gap-4">
                                        {
                                            agreement?.articulation.sendingArticulation.pickOneGroup.map((g,i)=>{
                                                return (
                                                    <div className="inline-block" key={g.fromClasses.map(c=>c.courseIdentifierParentId).join(",")}>
                                                        <p>
                                                            {
                                                                (g.fromClasses.map(c=>c.attributes?.map(c=>c.content).filter(c=>c.trim().length > 0).join(', '))) ??
                                                                (g.generalAttributes ?? []).join(', ')
                                                            }
                                                        </p>
                                                        
                                                        <p className="flex gap-2 flex-wrap items-center">
                                                            <Checkbox
                                                                id={g.fromClasses.map(c=>c.courseIdentifierParentId).join(",")}
                                                                checked={optionSelectedIndex === i}
                                                                onCheckedChange={()=>{c.selected = true;toggleOption(g.fromClasses)}}
                                                                >
                                                            </Checkbox >
                                                            <Label htmlFor={g.fromClasses.map(c=>c.courseIdentifierParentId).join(",")}>
                                                                {g.fromClasses.map(c=>`${c.prefix}${c.courseNumber} - ${c.courseTitle}`).join(" AND ")}
                                                            </Label>
                                                        </p>
                                                    </div>
                                                )
                                            })
                                        }
                                    </div>
                                </CardContent>
                            </Card>
                        </motion.div>
                    </CollapsibleContent>
                    )
                }
            </AnimatePresence>
        </Collapsible>
    )

}