import { Plan } from "~/components/plan/plan";
import { getCollegeInfo } from "~/lib/data";

export default async function PlanPage({ params }: { params: { slug: string } }) {

    const { transferColleges, communityColleges } = await getCollegeInfo()
    const transferCollegeMap = new Map(transferColleges)
    const communityCollegeMap = new Map(communityColleges)
    return (
        <main className="h-full">
           <Plan transferColleges={transferCollegeMap} communityColleges={communityCollegeMap}
                homeID={Number(params.slug)}
            />
        </main>
    )
}