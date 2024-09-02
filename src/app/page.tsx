import Link from "next/link";
import { Label } from "~/components/ui/label";
import { CollegePicker } from "~/components/ui/picker";
import { getCollegeInfo } from "~/lib/data";



export default async function HomePage() {

  const collegeData = await getCollegeInfo()
  const options = collegeData.communityColleges.map(entry=>entry[1]).map(s=>({
    label: s.name,
    value: s.name.toLowerCase().replaceAll(" ", "-").replaceAll(",","%2C").toString()
  }))

  return (
    <div className="h-full flex flex-col justify-between items-center px-4">
      <main className="flex-grow flex flex-col gap-12 justify-center items-center w-full">
        <div className="text-center space-y-2">
          <h1 className="text-4xl tracking-wider md:text-6xl font-bold">
            Transfer Helper
          </h1>
          <h2 className="text-lg md:text-xl">
            Get your California Community College transfer plan in <b>minutes</b>
          </h2>
        </div>
        <aside className="max-w-4xl w-full mx-auto px-6 space-y-4">
          <p className="space-y-1">
            <Label htmlFor="homeCC">Your Primary Community College</Label>
            <CollegePicker options={options} />
          </p>
        </aside>
      </main>
      <footer className="w-full text-center mt-8">
        <Link href="https://studykit.app" className="hover:underline text-sm opacity-75" target="_blank">
          🦊 Want to see more educational tools from us? Check out StudyKit!
        </Link>
      </footer>
    </div>
  );
}