import Link from "next/link"
import { Button } from "../button"
import { InfoIcon, MapIcon, RabbitIcon } from "lucide-react"

export const links = [
  { href: "/about", label: "About", Icon: InfoIcon },
  { href: "/roadmap", label: "Roadmap", Icon: MapIcon },
]

export default function NavDesktop({className}:{
  className?:string
}){
    return (
      <nav className={className}>
        <Link href="/" className="md:px-12 px-4">
          <RabbitIcon className="size-12"/>
        </Link>
        {
          links.map((link, index) => (
            <Link key={index} href={link.href}>
              <Button size="sm" Icon={link.Icon}>
                {link.label}
              </Button>
            </Link>
          ))
        }   
      </nav>
    )
}

