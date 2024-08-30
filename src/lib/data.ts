export const API_URL_BASE = "https://cdn.jsdelivr.net/gh/Basalt49re/AssistData@updated";
export const LAST_UPDATED = "8/25/2024";
export const getLastUpdatedYear = () => LAST_UPDATED.split("/")[2];

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