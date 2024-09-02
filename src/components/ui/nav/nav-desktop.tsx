import Link from "next/link"
import { Button } from "../button"
import { InfoIcon, MapIcon, RabbitIcon } from "lucide-react"
import { LAST_UPDATED } from "~/lib/data"
import { Badge } from "../badge"

export const links = [
  { href: "/about", label: "About", Icon: InfoIcon },
  { href: "https://github.com/LehuyH/transfer-helper/issues", label: "Roadmap", Icon: MapIcon, newTab: true },
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
            <Link key={index} href={link.href} target={link.newTab ? "_blank" : "_self"}>
              <Button size="sm" Icon={link.Icon}>
                {link.label}
              </Button>
            </Link>
          ))
        }
        <Badge variant={"outline"} className="ml-auto mr-[10%]">
          Data Last Updated: {LAST_UPDATED}
        </Badge>  
      </nav>
    )
}

