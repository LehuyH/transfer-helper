"use client";

import { DataSchool } from "~/lib/data";
import { PlanCollegePicker } from "./plan-college-picker";
import { useState } from "react";
import { Button } from "../ui/button";
import { XIcon } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "../ui/card";
import { Separator } from "../ui/separator";
import { PickerWithGroups } from "../ui/picker";
import { Label } from "../ui/label";


interface Props {
    transferColleges: Map<number, DataSchool & { majors: string[] }>
    communityColleges: Map<number, DataSchool>
    homeID: number
}

export function Plan({ transferColleges, homeID, communityColleges }: Props) {
    const [selectedTransferColleges, setSelectedTransferColleges] = useState<Record<string, boolean>>({})
    const [selectedMajors, setSelectedMajors] = useState<Record<string,{
        transferCollegeID:number,
        value:string,
    }>>({})
    const selectedMajorSet = Object.keys(selectedMajors)

    const selectedColleges = Object.entries(selectedTransferColleges)
        .filter(([_, v]) => v)
        .map(([k, _]) => k)
    
    const optionsTransferFiltered = new Map([
        ...transferColleges
    ])
    selectedColleges.forEach(v=>optionsTransferFiltered.delete(Number(v)))

    const majorOptions = selectedColleges.map(id=>{
        const college = transferColleges.get(Number(id))!
        return{
           label:college.name,
           options:college.majors.map(m=>({
                label:m,
                value:m+"[SPLIT]"+id
           })).filter(m=>!selectedMajorSet.includes(m.value))
        }
    })

    

    return (
        <div className="p-2 w-full max-w-7xl mx-auto space-y-4">
            <div className="md:grid grid-cols-2 gap-4 w-full">
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
                            <div className="flex flex-wrap overflow-y-auto gap-2 text-sm">
                                {
                                    selectedColleges.map((n) => {
                                        const college = transferColleges.get(Number(n))
                                        return (
                                            <Button onClick={(e) => setSelectedTransferColleges((prev)=>{
                                                const copy = {...prev}
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
                                        [id]:{
                                            transferCollegeID:Number(id.split("[SPLIT]")[1]),
                                            value:id
                                        }
                                    })
                                }
                                }
                            />
                            <div className="flex flex-wrap overflow-y-auto gap-2 text-sm">
                                {
                                    Object.entries(selectedMajors).map(([key,major]) => {
                                        const [majorName,collegeID] = key.split("[SPLIT]")
                                        const college = transferColleges.get(Number(collegeID))!.code
                                        return (
                                            <Button onClick={(e) => setSelectedMajors((prev)=>{
                                                const copy = {...prev}
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
            <Separator/>

            {
                (selectedMajorSet.length === 0) ?
                    <div className="text-center py-12">
                        <Label>Select a Transfer College and Major to begin ☝️</Label>
                    </div>

                :
                    <h1>
                        hi
                    </h1>

            }




        </div>
    )
}