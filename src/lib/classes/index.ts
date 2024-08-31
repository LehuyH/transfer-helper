import type {
    Agreement,
    Articulation,
    CellType,
    Group as IGroup,
    Section as ISection,
} from "@lehuyh/assist-js/types";

export type REQUIREMENT_STATUS = "REQUIRED" | "NOT_REQUIRED" | "NEUTRAL";

export interface FulfillmentProps {
    fromClassesTaken: Set<number>,
    numClassesUsed: Map<number, number>,
    agreements: Map<string, Agreement>
}

export interface Fulfillment {
    fufilled: boolean;
    missing: number[];
    warnings: string[];
}

export class Cell {
    data: CellType;
    templateCellId: string;
    units: number;
    required: REQUIREMENT_STATUS;

    constructor(cell: CellType, forceRequirment?: REQUIREMENT_STATUS) {
        this.data = cell;
        this.templateCellId = cell.templateCellId;
        this.units = this.data.courses.reduce((a, b) => a + b.maxUnits, 0)

        if (this.checkIsRequired() !== "NEUTRAL") {
            this.required = this.checkIsRequired();
        } else if (forceRequirment) {
            this.required = forceRequirment;
        } else {
            this.required = "NEUTRAL";
        }
    }

    isFufilled(
        { fromClassesTaken, numClassesUsed, agreements }: FulfillmentProps
    ): Fulfillment {
        let missing: number[] = [];
        let warnings: string[] = [];
        const agreement = agreements.get(this.templateCellId);
        if (!agreement) {
            return {
                fufilled: true,
                missing: [],
                warnings: [`No articulation for ${this.data.courses.map(c => `${c.prefix}${c.courseNumber}`).join(", ")}. This requirement MAY be waived.`]
            }
        }

        let atLeastOneFufilled = false;
        for (const group of agreement.articulation.sendingArticulation.pickOneGroup) {
            const draftUsedMap = new Map<number, number>(numClassesUsed);
            let groupFufilled = true;

            for (const fromClass of group.fromClasses) {
                const fromClassID = fromClass.courseIdentifierParentId;
                const classLimited = fromClass.attributes?.some(a => a.content.toLowerCase().includes("can only apply to one"))
                const classNotFufilled = !fromClassesTaken.has(fromClassID);
                const classCantBeUsed = fromClassesTaken.has(fromClassID) && classLimited && draftUsedMap.get(fromClassID) !== 0;

                if (classNotFufilled || classCantBeUsed) {
                    groupFufilled = false;
                    missing.push(fromClassID);
                    if (classCantBeUsed) {
                        warnings.push(`${fromClass.courseTitle} cannot be reused for transfer course ${this.data.courses.map(c => c.courseTitle).join(", ")}`);
                    }
                } else {
                    draftUsedMap.set(fromClassID, (draftUsedMap.get(fromClassID) ?? 0) + 1);

                }
            }

            if (group.fromClasses.length === 0) {
                warnings.push(`No articulation for ${this.data.courses.map(c => `${c.prefix}${c.courseNumber}`).join(", ")}. This requirement MAY be waived.`);
            }

            if (!groupFufilled) {
                const groupMissing = group.fromClasses.map((fromClass) => `${fromClass.prefix}${fromClass.courseNumber}`);
                warnings.push(`Complete the following courses from the group: ${groupMissing.join(", ")}`);
            } else {
                atLeastOneFufilled = true;
                //Commit draftUsedMap to numClassesUsed
                for (const [key, value] of draftUsedMap) {
                    numClassesUsed.set(key, value);
                }
            }
        }

        if (atLeastOneFufilled) {
            warnings = [];
            missing = [];
        }

        return {
            fufilled: atLeastOneFufilled,
            missing: missing,
            warnings: warnings
        };
    }

    checkIsRequired(): REQUIREMENT_STATUS {
        if (this.data.type === "GeneralEducation") return "NOT_REQUIRED";
        if (this.data.type === "Course") {
            if (
                this.data.courseAttributes?.some((text) =>
                    text.toLowerCase().includes("not required") ||
                    text.toLowerCase().includes("recommended")
                )
            ) return "NOT_REQUIRED";
            if (
                this.data.courseAttributes?.some((text) =>
                    text.toLowerCase().includes("require")
                )
            ) return "REQUIRED";
        }
        if (this.data.type === "Series") {
            if (
                this.data.seriesAttributes?.some((text) =>
                    text.toLowerCase().includes("not required") ||
                    text.toLowerCase().includes("recommended")
                )
            ) return "NOT_REQUIRED";
            if (
                this.data.seriesAttributes?.some((text) =>
                    text.toLowerCase().includes("require")
                )
            ) return "REQUIRED";
        }
        return "NEUTRAL";
    }
}

export class Section {
    pending = false;
    data: ISection;

    agreements: Cell[][];
    requiredAgreements: Cell[][];

    instruction: {
        pick?: {
            amount: number,
            type: "CLASS" | "UNIT"
        }
        all?: true
    }

    max: {
        unitsFufilled: number,
        classesFufilled: number
    }


    constructor(section: ISection, isRequired?: boolean) {
        this.data = section;
        this.agreements = section.agreements.map(r => r.courses.map(c => new Cell(c,
            (isRequired ?? false) ? "REQUIRED" : undefined
        )))

        //Populate instruction
        //CASE 1, Pick N
        const pickN = this.data.sectionAdvisements?.find(a => a.type === 'NFollowing')
        if (pickN) {
            this.instruction = {
                pick: {
                    amount: pickN.amount,
                    type: pickN.amountUnitType.toLowerCase().includes("unit") ? "UNIT" : "CLASS"
                }
            }

            if (pickN.amountUnitType.toLowerCase().includes("unit")) {
                this.instruction.pick!.type = "UNIT";
            } else {
                this.instruction.pick!.type = "CLASS";
            }
        } else {
            this.instruction = {
                all: true
            }
        }

        //Populate max
        this.requiredAgreements = this.agreements.filter(a => a.some(c => c.required === "REQUIRED"))
        this.max = {
            unitsFufilled: this.requiredAgreements.reduce((a, b) => b.reduce((a, v) => v.units, 0), 0),
            classesFufilled: this.requiredAgreements.reduce((a, b) => b.reduce((a, v) => v.data.courses.length, 0), 0)
        }
    }

    isFufilled(props: FulfillmentProps): {
        fufilled: boolean,
        units: number,
        classes: number
    } {

        let unitsFufilled = 0;
        let classesFufilled = 0;

        for (const agreement of this.requiredAgreements) {
            for (const cell of agreement) {
                const fufillment = cell.isFufilled(props);
                if (fufillment.fufilled) {
                    unitsFufilled += cell.units;
                    classesFufilled += cell.data.courses.length;
                }
            }
        }



        if (this.instruction.pick) {
            const amount = this.instruction.pick.amount;
            const type = this.instruction.pick.type;
            if (type === "UNIT") {
                return {
                    fufilled: unitsFufilled === Math.min(amount, this.max.unitsFufilled),
                    units: unitsFufilled,
                    classes: classesFufilled

                };
            } else {
                return {
                    fufilled: classesFufilled === Math.min(amount, this.max.classesFufilled),
                    units: unitsFufilled,
                    classes: classesFufilled
                }
            }
        } else {
            //ALL
            return {
                fufilled: classesFufilled === this.max.classesFufilled,
                units: unitsFufilled,
                classes: classesFufilled
            }
        }
    }

    getRequiredCellIDs() {
        return this.agreements.flatMap(a => a).filter(c => c.required === "REQUIRED").flatMap(c => c.data.templateCellId)
    }

}

export class Group {
    data: IGroup & {
        name: string
    };

    required: REQUIREMENT_STATUS;

    sections: Section[];

    instruction: {
        pick?: {
            amount: number,
            type: "CLASS" | "UNIT"
        }
        type: "Or" | "And"
    };

    constructor(name: string, group: IGroup) {
        this.data = {
            ...group,
            name: name
        };

        //Parse required
        if (name.toLowerCase().includes('recommended')) {
            this.required = "NOT_REQUIRED";
        } else if (name.toLowerCase().includes('required')) {
            this.required = "REQUIRED";
        } else if (this.data.groupAttributes?.find(a => a.toLowerCase().includes("required") && !a.toLowerCase().includes("recommended"))) {
            this.required = "REQUIRED";
        } else {
            this.required = "NOT_REQUIRED";
        }

        //Parse instruction
        if (!this.data.groupInstruction) {
            this.instruction = {
                type: "And"
            }
        } else if (this.data.groupInstruction.type === "NFromArea" || this.data.groupInstruction.type === "") {
            this.instruction = {
                pick: {
                    amount: this.data.groupInstruction.amount!,
                    type: this.data.groupInstruction.amountUnitType!.toLowerCase().includes("unit") ? "UNIT" : "CLASS"
                },
                type: this.data.groupInstruction.conjunction === "Or" ? "Or" : "And"
            }
        } else {
            this.instruction = {
                type: this.data.groupInstruction.conjunction === "Or" ? "Or" : "And"
            }
        }

        //Build sections
        this.sections = this.data.sections.map(s => new Section(s, this.required === "REQUIRED"))
    }

    getRequiredCellIDs() {
        return this.sections.flatMap(s => s.getRequiredCellIDs())
    }

    isFufilled(props: FulfillmentProps) {
        //PICK
        if (this.instruction.pick) {
            //Pick OR, cumulative allowed
            if (this.instruction.type === "Or") {
                let unitsFufilled = 0;
                let classesFufilled = 0;

                for (const section of this.sections) {
                    const fufillment = section.isFufilled(props);
                    unitsFufilled += fufillment.units;
                    classesFufilled += fufillment.classes;
                }

                const amount = this.instruction.pick.amount;
                const type = this.instruction.pick.type;
                if (type === "UNIT") {
                    return {
                        fufilled: unitsFufilled === this.instruction.pick.amount,
                        units: unitsFufilled,
                        classes: classesFufilled
                    }
                } else {
                    return {
                        fufilled: classesFufilled === this.instruction.pick.amount,
                        units: unitsFufilled,
                        classes: classesFufilled
                    }
                }
            }

            //Pick AND, cumulative not allowed
            if (this.instruction.type === "And") {
                let allFufilled = true;
                for (const section of this.sections) {
                    const fufillment = section.isFufilled(props);
                    if (this.instruction.pick.type === "UNIT") {
                        if (fufillment.units < this.instruction.pick.amount) {
                            allFufilled = false;
                            break;
                        }
                    } else {
                        if (fufillment.classes < this.instruction.pick.amount) {
                            allFufilled = false;
                            break;
                        }
                    }
                }
            }


        }

        //OR, at least one fulfilled
        else if (this.instruction.type === "Or") {
            return this.sections.some(s => s.isFufilled(props).fufilled)
        }

        //AND, all fulfilled
        else {
            return this.sections.every(s => s.isFufilled(props).fufilled)
        }
    }
}