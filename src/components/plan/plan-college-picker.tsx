"use client";

import type { DataSchool } from "~/lib/data";
import { Picker } from "../ui/picker";

interface Props{
    transferColleges: Map<number,DataSchool>
    onSelect: (s:string)=>void
}

export function PlanCollegePicker({ transferColleges,onSelect }: Props){
 const options = Array.from(transferColleges.values()).map(s=>({
    label: s.name,
    value: s.id.toString()
 }))

 return (
    <div>
        <Picker cta="Add a transfer college..." options={options} onSelect={onSelect}/>
    </div>
 )

}