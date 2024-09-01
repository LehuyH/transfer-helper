import type { Cell, FulfillmentProps, Group, Section } from "~/lib/classes";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "../ui/card";
import { createContext, Dispatch, Fragment, SetStateAction, useContext, useState } from "react";
import { Separator } from "../ui/separator";
import { Avatar, AvatarFallback } from "../ui/avatar";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "../ui/collapsible";
import { AlertCircle, CheckIcon, ChevronDown, ChevronUp, MessageCircleWarning } from "lucide-react";
import { Agreement, Course as ICourse } from "@lehuyh/assist-js/types";
import { Button } from "../ui/button";
import { motion, AnimatePresence } from "framer-motion"
import { Alert, AlertDescription, AlertTitle } from "../ui/alert";
import { Badge } from "../ui/badge";

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
    return (
        <Card>
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
                                Pick {group.instruction.pick.amount} {group.instruction.type}(s) from
                            </>
                            : <>
                                Complete
                            </>
                    }
                    {
                        (" " + group.sections.map(s => s.letter).join(` ${group.instruction.type.toLowerCase()} `))
                    }
                </h2>
                <FufilmentContext.Provider value={{
                    ...fulfilment,
                    setUserFromClassesTaken
                }}>
                    {
                        group.sections.map((s, i) => {
                            return (
                                <Fragment key={s.letter}>
                                    <PlanSection key={s.letter} section={s} />
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


function PlanSection({ section }: { section: Section }) {
    const fufilment = useContext(FufilmentContext)
    const readyCheck = section.readyCheck(fufilment)
    const fufilmentCheck = section.isFufilled(fufilment)
    return (
        <div className="py-4 md:flex items-start gap-12">
            <Avatar className="mb-2 md:mb-0 md:translate-x-0 -translate-x-1">
                <AvatarFallback className={
                    (fufilmentCheck.fufilled) ? "bg-green-600 text-white" : ""
                }>{section.letter}</AvatarFallback>
            </Avatar>

            <div className="flex flex-col space-y-6 w-full">
                {
                    (section.instruction.pick) && 
                    <Alert>
                        {
                            (fufilmentCheck.fufilled) ? <CheckIcon className="text-green-500 shrink-0"/> : <AlertCircle/>
                        }
                        <AlertTitle>{
                            (section.instruction.pick)
                                ? `Pick a total of ${section.instruction.pick.amount} ${section.instruction.pick.type.toLowerCase()}${section.instruction.pick.type.toLowerCase().endsWith("s") ? "(es)" : "(s)"} from ${section.letter}`
                                : `Complete ${section.letter}`                            
                        }</AlertTitle>
                        <AlertDescription>
                            {(fufilmentCheck.fufilled) ? "You are good to go!" : readyCheck.message}
                        </AlertDescription>
                    </Alert>
                }
                {
                    section.agreements.map((a, i) => {
                        return (
                            <SectionRow key={i} cells={a} hasInstruction={typeof section.instruction.pick !== 'undefined'} />
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
    const noArticulation = !(agreement?.articulation.sendingArticulation.pickOneGroup)

    const optionSelectedIndex = agreement?.articulation.sendingArticulation.pickOneGroup.findIndex(g=>
        g.fromClasses.map(c=>c.courseIdentifierParentId).every(id=>fufilment.fromClassesTaken[id])
    )

    const oneOptionSelected = optionSelectedIndex !== -1

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
                        {c.data.courses.reduce((a, b) => a + b.maxUnits, 0)} Units
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
                                        <b>{fufilmentCheck.warnings.join("\n")}</b>
                                        <p>
                                            {
                                                (onlyOneOption && !hasInstruction) &&
                                                "You cannot de-select this option as it is required"
                                            }
                                             {
                                                (agreement?.receivingAttributes.courseAttributes ?? [])
                                                .concat(agreement?.receivingAttributes.seriesAttributes ?? [])
                                                .concat(agreement?.receivingAttributes.seriesCourseAttributes ?? [])
                                                .concat(agreement?.articulation.courseAttributes ?? [])
                                                .concat(agreement?.articulation.generalAttributes ?? [])
                                                .concat(agreement?.articulation.seriesAttributes ?? [])
                                                .concat(agreement?.articulation.sendingArticulation.generalAttributes ?? [])
                                                .join(', ')
                                           }
                                        </p>
                                        <p>
                                        {
                                           (c.data.type === 'Series') ?
                                            (c.data.generalAttributes ?? []).concat(c.data.seriesAttributes ?? []).join(', ')
                                            : (c.data.generalAttributes ?? []).concat(c.data.courseAttributes ?? []).join(', ')
                                        }
                                        </p>
                                    </CardDescription>
                          
                                </CardHeader>
                                <CardContent>
                                    <div className="flex flex-wrap gap-2">
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
                                                        <Button
                                                            onClick={()=>toggleOption(g.fromClasses)}
                                                            variant={(i === optionSelectedIndex) ? 'default' : 'secondary'}
                                                            disabled={(onlyOneOption && !hasInstruction)}
                                                            Icon={ (i === optionSelectedIndex) ? CheckIcon : undefined }
                                                            >
                                                            {g.fromClasses.map(c=>`${c.prefix}${c.courseNumber} - ${c.courseTitle}`).join(" AND ")}
                                                        </Button>
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