import type {
    Agreement,
    Articulation,
    CellType,
    Course,
    Group as IGroup,
    Section as ISection,
} from "@lehuyh/assist-js/types";

export type REQUIREMENT_STATUS = "REQUIRED" | "NOT_REQUIRED" | "NEUTRAL";

export interface FulfillmentProps {
    fromClassesTaken: Record<number, Course & {
        requiredBy: string[]
    }>,
    numClassesUsed: Map<string, string>,
    agreements: Map<string, (Agreement &{
        major: string
    })>
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
    selected = false;

    constructor(cell: CellType, forceRequirements?: REQUIREMENT_STATUS) {
        //@ts-ignore HACK for GEs
        if(!cell.courses && cell.generalEducationArea){
            //@ts-ignore
            const geName = cell.generalEducationArea.name
            //@ts-ignore
            const geCode = cell.generalEducationArea.code
            cell.courses = [{
                courseTitle:geName,
                id: cell.templateCellId + '-GE-' +geName,
                maxUnits: 0,
                prefix: geCode,
                courseNumber: '',
                position:-1,
                courseIdentifierParentId: -1,
                departmentParentId: -1,
                prefixParentId: -1,
                prefixDescription: '',
                department:'',
                begin:'',
                end:'',
                minUnits:0,
            }]
        }
        this.data = cell;
        this.templateCellId = cell.templateCellId;
        this.units = this.data.courses?.reduce((a, b) => a + (b?.maxUnits ?? 0), 0)

        if (this.checkIsRequired() !== "NEUTRAL") {
            this.required = this.checkIsRequired();
        } else if (forceRequirements) {
            this.required = forceRequirements;
        } else {
            this.required = "NEUTRAL";
        }

        if(this.required === "REQUIRED") this.selected = true;
    }

    isFufilled(
        { fromClassesTaken, numClassesUsed, agreements }: FulfillmentProps
    ): Fulfillment {

        let missing: number[] = [];
        let warnings: string[] = [];
        let groupMissing: string[] = [];
        const agreement = agreements.get(this.templateCellId);
        if (!agreement) {
            return {
                fufilled: false,
                missing: [],
                warnings: [`No articulation for ${this.data.courses?.map(c => `${c.prefix}${c.courseNumber}`).join(", ")}. This requirement MAY be waived.`]
            }
        }

        let atLeastOneFufilled = false;
        for (const group of agreement.articulation.sendingArticulation.pickOneGroup) {
            const draftUsedMap = new Map<string, string>(numClassesUsed);
            let groupFufilled = true;

            for (const fromClass of group.fromClasses) {
                const fromClassID = fromClass.courseIdentifierParentId;
                const key = `${fromClassID}-${agreement.major}`
                const classLimited = fromClass.attributes?.some(a => a.content.toLowerCase().includes("can only apply to one"))
                const classNotFufilled = !fromClassesTaken[fromClassID];
                const classCantBeUsed = fromClassesTaken[fromClassID] && classLimited &&  (draftUsedMap.get(key) && draftUsedMap.get(key) !== this.templateCellId);

                if (classNotFufilled || classCantBeUsed) {
                    groupFufilled = false;
                    missing.push(fromClassID);
                    if (classCantBeUsed) {
                        warnings.push(`${fromClass.courseTitle} cannot be reused for transfer course ${this.data.courses?.map(c => c.courseTitle).join(", ")}`);
                    }
                } else {
                    draftUsedMap.set(key,this.templateCellId);
                }
            }

            if (group.fromClasses.length === 0) {
                warnings.push(`No articulation for ${this.data.courses?.map(c => `${c.prefix}${c.courseNumber}`).join(", ")}. This requirement MAY be waived.`);
            }

            if (!groupFufilled) {
                groupMissing.push(group.fromClasses.map((fromClass) => `${fromClass.prefix}${fromClass.courseNumber}`).join(", "));
            } else {
                atLeastOneFufilled = true;
                //Commit draftUsedMap to numClassesUsed
                for (const [key, value] of draftUsedMap) {
                    numClassesUsed.set(key, value ?? "");
                }
            }
        }

        if (atLeastOneFufilled) {
            warnings = [];
            missing = [];
        }

        if(groupMissing.length > 0){
            warnings.push(`Select: ${groupMissing.join(" OR ")}`)
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
    selected = false;
    letter = "";
    data: ISection;

    agreements: Cell[][];
    requiredAgreements: Cell[][] = [];
    required = false;

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
    } = {
        unitsFufilled: 0,
        classesFufilled: 0
    }


    constructor(section: ISection, forceRequirements?: REQUIREMENT_STATUS) {
        this.data = section;
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

        //We only force requirement if there's no instruction 
        this.agreements = section.agreements.map(r => r.courses.map(c => new Cell(c,
            (this.instruction.pick) ?  undefined : forceRequirements
        )))
        

        this.updateRequiredCells()

        if (this.requiredAgreements.length > 0 || forceRequirements === 'REQUIRED'){
            this.required = true;
            this.selected = true;
        }
    }

    updateRequiredCells(articulations?:FulfillmentProps['agreements']){
         //Populate max
         this.requiredAgreements = this.agreements.filter(a => a.some(c => c.required === "REQUIRED" || c.selected))
         if(!articulations){
            this.max = {
                unitsFufilled: this.agreements.reduce((a, b) => a+ b.reduce((a, v) => a + v.units, 0), 0),
                classesFufilled: 0
            }
         }else{
            this.max = {
                unitsFufilled: this.agreements.reduce((a, b) => a+ b.reduce((a, v) => a +v.units, 0), 0),
                classesFufilled: this.agreements.flat().reduce((a,cell)=>{
                    const agreement = articulations.get(cell.templateCellId)
                    const hasNoArticulations = !agreement || agreement?.articulation.sendingArticulation.pickOneGroup.length === 0
                    if(hasNoArticulations){
                        return a;
                    }
                    return a + ((cell.data.courses?.length > 0) ? 1 : 0)
                },0)
            }
         }
    }
    
    smartPickCellIDs(agreements: FulfillmentProps['agreements'],force?:boolean){
        if(!this.required && !force) return [];

        const alreadySelected = this.getRequiredCellIDs()
        const articulationsByRow = this.agreements.map(row=>row.map(c=>({
            cell:c,
            articulation: agreements.get(c.templateCellId)
        })))

        //Now attempt to find obvious options
        const options = [] as string[]
        for(const row of articulationsByRow){
            for(const {cell,articulation} of row){
                if(alreadySelected.includes(cell.templateCellId)) continue;

                //If there's one option only, select it
                if(articulation?.articulation.sendingArticulation?.pickOneGroup?.length === 1){
                    options.push(cell.templateCellId)
                    cell.selected = true
                    cell.required = "REQUIRED"
                }
            }
        }

        this.updateRequiredCells(agreements)

        //If options less than pick OR instruction is All, return all options
        if((this.instruction.pick && options.length <= this.instruction.pick.amount) || this.instruction.all){
            return options;
        }else{
            return [];
        }
    }

    isFufilled(props: FulfillmentProps): {
        fufilled: boolean,
        units: number,
        classes: number
    } {
        this.updateRequiredCells(props.agreements)
        const { units: unitsFufilled, classes: classesFufilled } = this.getFilledData(props);
        if (this.instruction.pick) {
            const amount = this.instruction.pick.amount;
            const type = this.instruction.pick.type;
            if (type === "UNIT") {
                return {
                    fufilled: unitsFufilled >= Math.min(amount, this.max.unitsFufilled),
                    units: unitsFufilled,
                    classes: classesFufilled

                };
            } else {
                return {
                    fufilled: classesFufilled >= Math.min(amount, this.max.classesFufilled),
                    units: unitsFufilled,
                    classes: classesFufilled
                }
            }
        } else {
            //ALL
            return {
                fufilled: classesFufilled >= this.max.classesFufilled,
                units: unitsFufilled,
                classes: classesFufilled
            }
        }
    }

    getFilledData(props: FulfillmentProps) {
        let unitsFufilled = 0;
        let classesFufilled = 0;

        for (const agreement of this.agreements) {
            for (const cell of agreement) {
                const fufillment = cell.isFufilled(props);
                if (fufillment.fufilled) {
                    cell.selected = true;
                    unitsFufilled += cell.units;
                    classesFufilled += cell.data.courses?.length ?? 0;
                }
            }
        }

        return {
            units: unitsFufilled,
            classes: classesFufilled
        }
    }

    getRequiredCellIDs() {
        return this.agreements.flatMap(a => a).filter(c => c.required === "REQUIRED" || c.selected).flatMap(c => c.data.templateCellId)
    }

    getAllCellIDs(){
        return this.agreements.flatMap(a => a).flatMap(c => c.data.templateCellId)
    }

    readyCheck(props: FulfillmentProps): {
        ready: boolean,
        message: string | null
    } {
       //Pick
        if (this.instruction.pick) {
            const amount = this.instruction.pick.amount;
            const type = this.instruction.pick.type;
            const { units, classes } = this.getFilledData(props);

            if (type === "UNIT") {
                const passed = units >= amount;
                return {
                    ready: passed,
                    message: passed ? null : `Please select ${amount - units} more unit(s) in section ${this.letter}`
                }
            } else {
                const passed = classes >= amount;
                return {
                    ready: passed,
                    message: passed ? null : `Please select ${amount - classes} more class(es) in section ${this.letter}`
                }
            }
        }
        //All
        else {
            return {
                ready: true,
                message: null
            }
        }
    }

}

const ALPHABET = "ABCDEFGHIJKLMNOPQRSTUVWXYZ".split("");

export class Group {
    data: IGroup & {
        name: string
    };

    required: REQUIREMENT_STATUS;

    sections: Section[];

    schoolName: string
    majorName:string

    instruction: {
        pick?: {
            amount: number,
            type: "CLASS" | "UNIT"
        }
        type: "Or" | "And"
    };

    constructor(name: string, group: IGroup,schoolName:string,majorName:string) {
        this.data = {
            ...group,
            name: name
        };
        this.schoolName = schoolName
        this.majorName = majorName

        //Parse required
        if (name.toLowerCase().includes('recommended')) {
            this.required = "NOT_REQUIRED";
        } else if (name.toLowerCase().includes('require') || name === 'DEFAULT' || name.toLowerCase().includes('core')) {
            this.required = "REQUIRED";
        } else if (this.data.groupAttributes?.find(a => a.toLowerCase().includes("require") && !a.toLowerCase().includes("recommended"))) {
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

        //Parse advisements
        if(this.data.groupAdvisements && this.data.groupAdvisements.length > 0){
            this.data.groupAdvisements.forEach(a=>{

                if(a.type === 'NInNDifferentAreas'){
                    this.instruction.pick = {
                        amount: a.amount,
                        type: a.amountUnitType.toLowerCase().includes("unit") ? "UNIT" : "CLASS"
                    }
                }

            })
        }

        //Build sections
        this.sections = this.data.sections.map((s,i) =>{
            const section = new Section(s,(this.instruction.pick || this.instruction.type == 'Or') ? 'NEUTRAL' : this.required)
            if(this.instruction.pick && !section.instruction.pick){
                section.instruction = this.instruction
            }
            section.letter = ALPHABET[i]!
            return section
        })
    }

    /** All instructions are fulfilled */
    readyCheck(props: FulfillmentProps): {
        ready: boolean,
        message: string | null
    } {

        if (this.instruction.pick) {
            const amount = this.instruction.pick.amount;
            const type = this.instruction.pick.type;

            //Cumulative allowed in OR
            if (this.instruction.type === "Or") {
                let unitsFufilled = 0;
                let classesFufilled = 0;

                for (const section of this.getSelectedSections()) {
                    const fufillment = section.isFufilled(props);
                    unitsFufilled += fufillment.units;
                    classesFufilled += fufillment.classes;
                }

                if (type === "UNIT") {
                    const passed = unitsFufilled >= amount;
                    return {
                        ready: passed,
                        message: passed ? null : `Please select ${amount - unitsFufilled} more unit(s) across all sections`
                    }
                } else {
                    const passed = classesFufilled >= amount;
                    return {
                        ready: passed,
                        message: passed ? null : `Please select ${amount - classesFufilled} more classe(s) across all sections`
                    }
                }
            }else{
                //All selected in AND
                let allFufilled = true;
                const message: string[] = [];
               
                this.getSelectedSections().forEach((s)=>{
                    const { units, classes } = s.getFilledData(props);
                    if (type === "UNIT") {
                        if (units < amount) {
                            allFufilled = false;
                            message.push(`Section ${s.letter} requires ${amount - units} more unit(s)`)
                        }
                    }else {
                        if (classes < amount) {
                            allFufilled = false;
                            message.push(`Section ${s.letter} requires ${amount - classes} more classe(s_`)
                        }
                    }
                })

                return {
                    ready: allFufilled,
                    message: allFufilled ? null : message.join("\n")
                }
            }
        }else{
            if(this.instruction.type === "Or"){
                return this.sections.length > 0 ? {
                    ready: true,
                    message: null
                } : {
                    ready: false,
                    message: "Please select at least one section"
                }
            }else{
                return {
                    ready: true,
                    message: null
                }
            }
        }

    }

    getRequiredCellIDs() {
        return this.sections.flatMap(s => s.getRequiredCellIDs())
    }

    getSmartPickCellIDs(props: FulfillmentProps['agreements']){
        //IF there's an obvious OR choice (where only one section has all options), only smart pick that section
        if(this.instruction.type === 'Or'){
            const sectionsWithAllOptions = this.sections.filter(s=>{
                const cellIDS = s.getAllCellIDs()
                const allHasAgreement = cellIDS.every(id=>{
                    const agreement = props.get(id)
                    if(!agreement) return false;
                    return agreement.articulation.sendingArticulation.pickOneGroup.length > 0
                })

                return allHasAgreement
            })

            //Only if ONE
            if(sectionsWithAllOptions.length === 1){
                return sectionsWithAllOptions[0]!.smartPickCellIDs(props,true)
            }else{
                //Don't choose for user
                return []
            }
        }
        const options = this.sections.flatMap(s => s.smartPickCellIDs(props))
        if(this.instruction.pick) return [];
        return options
    }

    getSelectedSections() {
        return this.sections.filter(s => s.selected)
    }

    isFufilled(props: FulfillmentProps) {
        //PICK
        if (this.instruction.pick) {
            //Pick OR, cumulative allowed
            if (this.instruction.type === "Or") {
                let unitsFufilled = 0;
                let classesFufilled = 0;

                for (const section of this.getSelectedSections()) {
                    const fufillment = section.isFufilled(props);
                    unitsFufilled += fufillment.units;
                    classesFufilled += fufillment.classes;
                }

                const amount = this.instruction.pick.amount;
                const type = this.instruction.pick.type;
                if (type === "UNIT") {
                    const compareTo = Math.min(amount, this.getSelectedSections().reduce
                    ((a, b) => a + (b.max.unitsFufilled ?? 0), 0))
                    
                    return {
                        fufilled: unitsFufilled >= compareTo,
                        units: unitsFufilled,
                        classes: classesFufilled
                    }
                } else {
                    const compareTo = Math.min(amount, this.getSelectedSections().reduce
                    ((a, b) => a + (b.max.classesFufilled ?? 0), 0))
                    return {
                        fufilled: classesFufilled >= compareTo,
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
                        const compareTo = Math.min(this.instruction.pick.amount, section.max.unitsFufilled ?? 0)
                        if (fufillment.units < compareTo) {
                            allFufilled = false;
                            break;
                        }
                    } else {
                        const compareTo = Math.min(this.instruction.pick.amount, section.max.classesFufilled ?? 0)
                        if (fufillment.classes < compareTo) {
                            allFufilled = false;
                            break;
                        }
                    }
                }

                return {
                    fufilled: allFufilled,
                    message: allFufilled ? null : `Please select ${this.instruction.pick.amount} more classe(s) across all sections`
                }
            }


        }

        //OR, at least one fulfilled
        else if (this.instruction.type === "Or") {
            return {
                fufilled: this.sections.some(s => s.isFufilled(props).fufilled),
                missing:[],
                warnings:[]
            }
        }

        //AND, all fulfilled
        else {
            return {
                fufilled: this.sections.every(s => s.isFufilled(props).fufilled),
                missing:[],
                warnings:[]
            }
        }
    }
}