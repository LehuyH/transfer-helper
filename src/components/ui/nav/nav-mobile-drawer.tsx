"use client";

import { ChevronRight, MenuIcon } from "lucide-react";
import { Button } from "../button";
import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion"
import { links } from "./nav-desktop";
import Link from "next/link";

export default function NavMobileDrawer() {
    const [showMenu, setShowMenu] = useState(false)
    return (
        <>
            <Button onClick={() => setShowMenu(!showMenu)} Icon={MenuIcon}>
            </Button>
            <AnimatePresence>
                {
                    showMenu &&
                    <motion.div
                        className="fixed z-10 min-h-screen p-4 left-0 top-0 w-full bg-black/50 backdrop-blur-sm"
                        initial={{ x: '100%' }}
                        animate={{ x: 0 }}
                        exit={{ x: '100%' }}
                        transition={{
                            ease: 'easeInOut'
                        }}
                    >
                        <aside className="w-full flex justify-end">
                            <Button
                                onClick={() => setShowMenu(!showMenu)}
                                Icon={ChevronRight} />
                        </aside>

                        <ul className="space-y-4 py-4">
                            {
                                links.map((link, index) => (
                                    <Link key={index} href={link.href} className="block w-full">
                                        <Button Icon={link.Icon} className="w-full">
                                            {link.label}
                                        </Button>
                                    </Link>
                                ))
                            }
                        </ul>

                    </motion.div>
                }
            </AnimatePresence>



        </>
    )
}