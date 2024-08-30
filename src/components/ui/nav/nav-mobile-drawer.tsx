"use client";

import { ChevronRight, MenuIcon } from "lucide-react";
import { Button } from "../button";
import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion"

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
                        className="fixed z-10 min-h-screen p-4 left-0 top-0 w-full bg-slate-500"
                        initial={{ x: '100%' }}
                        animate={{ x: 0 }}
                        exit={{ x: '100%' }}
                        transition={{
                            ease:'easeInOut'
                        }}
                    >
                        <aside className="w-full flex justify-end">
                            <Button
                                onClick={() => setShowMenu(!showMenu)}
                                Icon={ChevronRight} />
                        </aside>
                    </motion.div>
                }
            </AnimatePresence>



        </>
    )
}