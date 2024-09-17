
"use client";
import Confetti from "react-confetti-boom"
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle } from "~/components/ui/sheet"
import { Drawer, DrawerClose, DrawerContent, DrawerDescription, DrawerFooter, DrawerHeader, DrawerTitle } from "~/components/ui/drawer"
import { Button } from "../ui/button"
import { LandPlot, LinkIcon, StarIcon } from "lucide-react"
import { createBreakpoint } from "react-use"
import { useState, useEffect } from "react";


const useBreakpoint = createBreakpoint({
    'sm': 640,
    'md': 768,
    'lg': 1024,
    'xl': 1280,
    '2xl': 1536,
});


export function PlanFinished({ homeCollege }: {
    homeCollege: string
}) {
    const breakpoint = useBreakpoint()
    const [drawerOpen, setDrawerOpen] = useState(true)
    const [sheetOpen, setSheetOpen] = useState(true)
    const scrollToPlan = () => document.getElementById('plan-class-table')?.scrollIntoView({
        behavior: 'smooth',
    })

    useEffect(() => {
        if(!sheetOpen || !drawerOpen) setTimeout(scrollToPlan, 500);
    }, [sheetOpen, drawerOpen])
    return (<>
        <div className="fixed top-0 left-0 z-[9999] pointer-events-none">
            <Confetti mode='boom' particleCount={200} y={-0.1} spreadDeg={180} />

        </div>
        {
            breakpoint === 'sm' ?

                (
                    <Drawer open={drawerOpen} onOpenChange={(o) => {
                        setDrawerOpen(o)
                        scrollToPlan()
                    }}>
                        <DrawerContent>
                            <DrawerHeader>
                                <DrawerTitle>Your Plan Is (Almost) Ready!</DrawerTitle>
                                <DrawerDescription>
                                    <b>THIS IS NOT A REPLACEMENT FOR A COLLEGE COUNSELOR</b>
                                    <br /><br />
                                    While this tool attempts to find all the requirements for your goals, we HIGHLY suggest manually validaiting this plan with ASSIST.org and a college counselor to make sure you are on the right track.
                                    <aside className="flex flex-wrap gap-2 pt-4">
                                        <Button variant="link" Icon={LinkIcon}>
                                            <a href="https://assist.org/" target="_blank">
                                                Review ASSIST.org
                                            </a>
                                        </Button>
                                        <Button variant="link" Icon={LinkIcon}>
                                            <a href={`https://www.google.com/search?btnI=1&q=${encodeURIComponent(homeCollege + ' counseling')}`} target="_blank" >
                                                Create Appointment with College Counselor
                                            </a>
                                        </Button>
                                        {/* <Button variant="link" Icon={StarIcon}>
                                            <a href="https://studykit.app" target="_blank">
                                                Free Study Tools (also made by me)
                                            </a>
                                        </Button> */}

                                    </aside>
                                </DrawerDescription>
                            </DrawerHeader>
                            <DrawerFooter>
                                <DrawerClose asChild>
                                    <Button variant="default" Icon={LandPlot} className="w-full">
                                        Review Plan
                                    </Button>
                                </DrawerClose>
                            </DrawerFooter>
                        </DrawerContent>
                    </Drawer >

                )


                :


                (
                    <Sheet defaultOpen={true} open={sheetOpen} onOpenChange={(o) => {
                        setSheetOpen(o)
                        scrollToPlan()
                    }}>
                        <SheetContent>
                            <SheetHeader>
                                <SheetTitle>Your Plan Is (Almost) Ready!</SheetTitle>
                                <SheetDescription>
                                    <b>THIS IS NOT A REPLACEMENT FOR A COLLEGE COUNSELOR</b>
                                    <br /><br />
                                    While this tool attempts to find all the requirements for your goals, we HIGHLY suggest manually validaiting this plan with ASSIST.org and a college counselor to make sure you are on the right track.
                                    <aside className="flex flex-wrap gap-2 pt-4">
                                        <Button variant="link" Icon={LinkIcon}>
                                            <a href="https://assist.org/" target="_blank">
                                                Review ASSIST.org
                                            </a>
                                        </Button>
                                        <Button variant="link" Icon={LinkIcon}>
                                            <a href={`https://www.google.com/search?btnI=1&q=${encodeURIComponent(homeCollege + ' counseling')}`} target="_blank" >
                                                Create Appointment with College Counselor
                                            </a>
                                        </Button>
                                        {/* <Button variant="link" Icon={StarIcon}>
                                            <a href="https://studykit.app" target="_blank">
                                                Free Study Tools (also made by me)
                                            </a>
                                        </Button> */}
                                        <Button onClick={() => setSheetOpen(false)} variant="default" Icon={LandPlot} className="w-full">
                                            Review Plan
                                        </Button>
                                    </aside>
                                </SheetDescription>
                            </SheetHeader>
                        </SheetContent>
                    </Sheet>
                )
        }

    </>
    )

}

