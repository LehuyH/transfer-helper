import type { AgreementByMajor } from "@lehuyh/assist-js/types";

export const API_URL_BASE = "https://cdn.jsdelivr.net/gh/Basalt49re/AssistData@react1";
export const LAST_UPDATED = "8/30/2024";
export const LAST_UPDATED_YEAR = LAST_UPDATED.split("/")[2];

export const escapeForFilename = (str: string) => str.replaceAll(" ","_").replaceAll("/","-").replaceAll(".","+").replaceAll(":",";")

export interface DataSchool{
    id:number,
    name:string,
    code: string,
    category: string
}

export const getCollegeInfo = async()=>{
    const res = await fetch(API_URL_BASE+'/data.json')
    return await res.json() as {
        communityColleges: [number,DataSchool][],
        transferColleges: [number,(DataSchool & {
            majors: string[]
        })][]
    }
}

export const getMajor = async({
    from, to, major
}:{
    from: number,
    to: number,
    major: string
})=>{
    const res = await fetch(`${API_URL_BASE}/${LAST_UPDATED_YEAR}/${from}-${to}/${escapeForFilename(major)}.json`)
    return await res.json() as AgreementByMajor
}