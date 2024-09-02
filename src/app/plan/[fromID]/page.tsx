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
        fromID: v[1].name.toLowerCase().replaceAll(" ", "-").toString()
    }))
}

export default async function PlanPage({ params }: { params: { fromID: string } }) {

    const { transferColleges, communityColleges } = await getCollegeInfo()
    const transferCollegeMap = new Map(transferColleges)
    const communityCollegeMap = new Map(communityColleges)
    const home = communityColleges.find(v=>v[1].name.toLowerCase().replaceAll(" ", "-").toString() === params.fromID)
    return (
        <main className="h-full">
           <Plan transferColleges={transferCollegeMap} communityColleges={communityCollegeMap}
                homeID={home[0]}
            />
        </main>
    )
}