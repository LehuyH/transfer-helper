import { RabbitIcon } from "lucide-react"
import Link from "next/link"
import NavMobileDrawer from "./nav-mobile-drawer"

export default function NavMobile({className}:{
    className?:string
}){
    return (
        <nav className={className}>
            <Link href="/">
                <RabbitIcon className="size-10"/>
            </Link>
            <NavMobileDrawer/>
        </nav>
    )
}