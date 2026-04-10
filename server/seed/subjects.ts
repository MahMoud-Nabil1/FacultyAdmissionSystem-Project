import mongoose from "mongoose";
import dotenv from "dotenv";
import path from "path";
import { Subject } from "../models/subject";

dotenv.config({ path: path.resolve(__dirname, "../.env") });

interface SubjectData {
    code: string;
    name: string;
    level: string;
    prerequisites: string[];
    creditHours: number;
}

const subjectsData: SubjectData[] = [
    { code: "MATH110", name: "Introduction to Algebra", level: "1", prerequisites: [], creditHours: 3 },
    { code: "MATH131", name: "Differential and Integral Calculus I", level: "1", prerequisites: [], creditHours: 3 },
    { code: "MATH170", name: "Newtonian Mechanics I", level: "1", prerequisites: [], creditHours: 3 },
    { code: "STAT100", name: "Mathematical Statistics I", level: "1", prerequisites: [], creditHours: 3 },
    { code: "PHYS101", name: "General Physics I", level: "1", prerequisites: [], creditHours: 3 },
    { code: "CHEM101", name: "General Chemistry I", level: "1", prerequisites: [], creditHours: 3 },
    { code: "MATH132", name: "Differential and Integral Calculus II", level: "1", prerequisites: ["MATH131"], creditHours: 3 },
    { code: "MATH171", name: "Newtonian Mechanics II", level: "1", prerequisites: ["MATH170"], creditHours: 3 },
    { code: "CS101", name: "Introduction to Computer Science", level: "1", prerequisites: [], creditHours: 3 },
    { code: "PHYS102", name: "General Physics II", level: "1", prerequisites: ["PHYS101"], creditHours: 3 },
    { code: "CHEM102", name: "General Chemistry II", level: "1", prerequisites: ["CHEM105"], creditHours: 3 },
    { code: "MATH211", name: "Roads and Geometry I", level: "2", prerequisites: ["MATH110"], creditHours: 3 },
    { code: "MATH231", name: "Differential and Integral Calculus III", level: "2", prerequisites: ["MATH132"], creditHours: 3 },
    { code: "MATH271", name: "Newtonian Mechanics III", level: "2", prerequisites: ["MATH171"], creditHours: 3 },
    { code: "CS201", name: "Computer Programming", level: "2", prerequisites: ["CS101"], creditHours: 3 },
    { code: "STAT201", name: "Probability Theory", level: "2", prerequisites: ["STAT100"], creditHours: 3 },
    { code: "MATH212", name: "Roads and Geometry II", level: "2", prerequisites: ["MATH211"], creditHours: 3 },
    { code: "MATH213", name: "Discrete Mathematics", level: "2", prerequisites: ["MATH110"], creditHours: 3 },
    { code: "MATH232", name: "Mathematical Analysis I", level: "2", prerequisites: ["MATH132"], creditHours: 3 },
    { code: "MATH241", name: "Ordinary Differential Equations", level: "2", prerequisites: ["MATH132"], creditHours: 3 },
    { code: "MATH272", name: "Analytical Mechanics", level: "2", prerequisites: ["MATH171"], creditHours: 3 },
    { code: "CS202", name: "Data Structures and Algorithms", level: "2", prerequisites: ["CS101"], creditHours: 3 },
    { code: "CS302", name: "Computer Organization", level: "3", prerequisites: ["CS201"], creditHours: 3 },
    { code: "CS304", name: "Computer Graphics", level: "3", prerequisites: ["MATH211", "CS201"], creditHours: 3 },
    { code: "CS305", name: "Algorithm Analysis and Design", level: "3", prerequisites: ["CS202"], creditHours: 3 },
    { code: "CS307", name: "Database Systems", level: "3", prerequisites: ["CS202"], creditHours: 3 },
    { code: "CS309", name: "Systems Analysis and Design", level: "3", prerequisites: ["CS201"], creditHours: 3 },
    { code: "CS303", name: "Software Engineering", level: "3", prerequisites: ["CS201"], creditHours: 3 },
    { code: "CS306", name: "Operating Systems", level: "3", prerequisites: ["CS201"], creditHours: 3 },
    { code: "CS308", name: "Database Design", level: "3", prerequisites: ["CS307"], creditHours: 3 },
    { code: "MATH302", name: "Mathematical Logic and Boolean Algebra I", level: "4", prerequisites: [], creditHours: 3 },
    { code: "MATH351", name: "Numerical Analysis I", level: "4", prerequisites: [], creditHours: 3 },
    { code: "MATH355", name: "Approximation Theory I", level: "4", prerequisites: [], creditHours: 3 },
    { code: "MATH361", name: "Mathematical Methods I", level: "4", prerequisites: [], creditHours: 3 },
    { code: "MATH373", name: "Electromagnetism and Optics I", level: "4", prerequisites: [], creditHours: 3 },
    { code: "CS316", name: "File Organization and Processing", level: "4", prerequisites: ["U101", "CS202"], creditHours: 3 },
    { code: "MATH302B", name: "Mathematical Logic and Boolean Algebra II", level: "4", prerequisites: ["MATH302"], creditHours: 3 },
    { code: "MATH352", name: "Numerical Analysis II", level: "4", prerequisites: ["MATH351"], creditHours: 3 },
    { code: "MATH356", name: "Approximation Theory II", level: "4", prerequisites: ["MATH355"], creditHours: 3 },
    { code: "MATH362", name: "Mathematical Methods II", level: "4", prerequisites: ["MATH361"], creditHours: 3 },
    { code: "MATH374", name: "Electromagnetism and Optics II", level: "4", prerequisites: ["MATH373"], creditHours: 3 },
    { code: "CS317", name: "Distributed Systems", level: "4", prerequisites: ["CS201"], creditHours: 3 },
    { code: "MATH411", name: "Number Theory", level: "4", prerequisites: [], creditHours: 3 },
    { code: "CS401", name: "Computer Networks", level: "4", prerequisites: ["CS306"], creditHours: 3 },
    { code: "CS403", name: "Formal Languages and Automata", level: "4", prerequisites: ["CS306"], creditHours: 3 },
    { code: "CS402", name: "Theory of Computation", level: "4", prerequisites: ["CS305", "MATH213", "STAT201"], creditHours: 3 },
    { code: "CS407", name: "Programming Language Design", level: "4", prerequisites: ["CS402"], creditHours: 3 },
    { code: "CS408", name: "Artificial Intelligence", level: "4", prerequisites: ["CS304"], creditHours: 3 },
    { code: "CS490", name: "Closed Research", level: "4", prerequisites: [], creditHours: 3 },
    { code: "MATH442", name: "Partial Differential Equations I", level: "4", prerequisites: [], creditHours: 3 },
    { code: "MATH452", name: "Numerical Solutions of Integral Equations", level: "4", prerequisites: ["MATH351"], creditHours: 3 },
    { code: "MATH472", name: "Computational Fluid Dynamics I", level: "4", prerequisites: [], creditHours: 3 },
    { code: "MATH478", name: "Elasticity Theory I", level: "4", prerequisites: [], creditHours: 3 },
    { code: "MATH492", name: "Linear Mechanics", level: "4", prerequisites: [], creditHours: 3 },
    { code: "MATH482", name: "Optimal Control Theory I", level: "4", prerequisites: [], creditHours: 3 },
    { code: "CS422", name: "Advanced Computer Networks", level: "4", prerequisites: ["CS306", "STAT201"], creditHours: 3 },
    { code: "CS442", name: "Advanced Operating Systems", level: "4", prerequisites: ["CS306"], creditHours: 3 },
    { code: "CS425", name: "Expert Systems", level: "4", prerequisites: ["CS317"], creditHours: 3 },
    { code: "CS427", name: "Selected Programming Languages", level: "4", prerequisites: ["CS201"], creditHours: 3 },
    { code: "CS428", name: "Selected Topics in Computer Science", level: "4", prerequisites: ["MATH211", "MATH411", "CS493"], creditHours: 3 },
    { code: "U110", name: "Critical Thinking", level: "4", prerequisites: [], creditHours: 2 },
    { code: "U111", name: "Entrepreneurship", level: "4", prerequisites: [], creditHours: 2 },
    { code: "U106", name: "Computer Skills", level: "4", prerequisites: [], creditHours: 2 },
    { code: "U102", name: "English Language I", level: "4", prerequisites: [], creditHours: 2 },
    { code: "U103", name: "Community Issues", level: "4", prerequisites: [], creditHours: 2 },
    { code: "U104", name: "Law and Professional Ethics", level: "4", prerequisites: [], creditHours: 2 },
    { code: "U105", name: "Management and Accounting", level: "4", prerequisites: [], creditHours: 2 },
    { code: "U106B", name: "Arabic Language", level: "4", prerequisites: [], creditHours: 2 },
    { code: "U107", name: "Islamic Culture", level: "4", prerequisites: [], creditHours: 2 },
    { code: "U108", name: "History and Philosophy of Science", level: "4", prerequisites: [], creditHours: 2 },
    { code: "U109", name: "Environmental Culture", level: "4", prerequisites: [], creditHours: 2 },
];

async function seedSubjects() {
    if (!process.env.MONGO_URI) {
        console.error("MONGO_URI is not set in .env file");
        process.exit(1);
    }

    try {
        await mongoose.connect(process.env.MONGO_URI);
        console.log("Connected to MongoDB");

        // Clear existing subjects
        await Subject.deleteMany({});
        console.log("Cleared existing subjects");

        // Step 1: Create all subjects without prerequisites first
        const codeToIdMap = new Map<string, mongoose.Types.ObjectId>();

        for (const data of subjectsData) {
            const subject = new Subject({
                code: data.code,
                name: data.name,
                level: data.level,
                prerequisites: [],
                corequisites: [],
                creditHours: data.creditHours,
            });
            const saved = await subject.save();
            codeToIdMap.set(data.code, saved._id);
            console.log(`Created: ${data.code} - ${data.name}`);
        }

        // Step 2: Update prerequisites with ObjectId references
        for (const data of subjectsData) {
            if (data.prerequisites.length > 0) {
                const prereqObjectIds = data.prerequisites
                    .map(code => codeToIdMap.get(code))
                    .filter((id): id is mongoose.Types.ObjectId => id !== undefined);

                if (prereqObjectIds.length > 0) {
                    await Subject.updateOne(
                        { code: data.code },
                        { $set: { prerequisites: prereqObjectIds } }
                    );
                    console.log(`Updated prerequisites for ${data.code}: [${data.prerequisites.join(", ")}]`);
                } else {
                    console.warn(`Warning: Could not resolve prerequisites for ${data.code}`);
                }
            }
        }

        console.log(`\nSuccessfully seeded ${subjectsData.length} subjects!`);
    } catch (error) {
        console.error("Error seeding subjects:", error);
    } finally {
        await mongoose.disconnect();
        console.log("Disconnected from MongoDB");
    }
}

seedSubjects();
