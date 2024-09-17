import { Metadata, ResolvingMetadata } from "next";
import { Plan } from "~/components/plan/plan";
import { getCollegeInfo } from "~/lib/data";

type Props = {
    params: { fromID: string }
    searchParams: { [key: string]: string | string[] | undefined }
  }

export async function generateMetadata(
    { params, searchParams }: Props,
    parent: ResolvingMetadata
  ): Promise<Metadata> {
    // read route params
    const name = params.fromID.split("-")
    .map(v=>`${v.charAt(0).toUpperCase()}${v.slice(1)}`)
    .join(" ")
    .replaceAll("%2C",",")
   
    return {
      title: `Transfer Plan | ${name}`,
      description: `Get help with building a transfer plan for ${name}. Supports all University Of California and California State University Colleges.`,
      openGraph: {
        title: `Transfer Plan | ${name}`,
        description: `Get help with building a transfer plan for ${name}. Supports all University Of California and California State University Colleges.`,
        images: [
        ],
        siteName: `Transfer Planner for ${name}`,
      },
      twitter: {
        card: "summary_large_image",
        title: `Transfer Plan | ${name}`,
        description: `Get help with building a transfer plan for ${name}. Supports all University Of California and California State University Colleges.`,
        images: [
        ],
      } 
    }
  }

export async function generateStaticParams(){
    const { communityColleges } = await getCollegeInfo() 
    
    return communityColleges.map(v=>({
        fromID: v[1].name.toLowerCase().replaceAll(" ", "-")
    }))
}

export default async function PlanPage({ params }: { params: { fromID: string } }) {

    const { transferColleges, communityColleges } = await getCollegeInfo()
    const transferCollegeMap = new Map(transferColleges
      .sort((a,b)=>{
      const aIsUC = a[1].category === "UC"
      const bIsUC = b[1].category === "UC"
      if(aIsUC && !bIsUC) return -1
      if(!aIsUC && bIsUC) return 1
      return a[1].name.localeCompare(b[1].name)
    }))

    //Update Names
    transferCollegeMap.set(21,{
      ...transferCollegeMap.get(21)!,
      name: "California State University, East Bay / Hayward"
    })


    const communityCollegeMap = new Map(communityColleges)
    const home = communityColleges.find(v=>v[1].name.toLowerCase().replaceAll(" ", "-").replaceAll(",","%2C")
    === params.fromID
  )!
    return (
        <main className="h-full">
           <Plan transferColleges={transferCollegeMap} communityColleges={communityCollegeMap}
                homeID={home[0]}
            />
        </main>
    )
}