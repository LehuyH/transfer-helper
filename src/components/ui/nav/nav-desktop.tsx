import Link from "next/link"
import { Button } from "../button"
import { InfoIcon, MapIcon, RabbitIcon } from "lucide-react"

export default function NavDesktop({className}:{
  className?:string
}){
    return (
        <nav className={className}>
        <Link href="/" className="md:px-12 px-4">
          <RabbitIcon className="size-12"/>
        </Link>
        <Link href="/about">
          <Button size="sm" Icon={InfoIcon}>
             About
          </Button>
        </Link>
        <Link href="/roadmap">
          <Button size="sm" Icon={MapIcon}>
             Roadmap
          </Button>
        </Link>
      </nav>
    )
}
