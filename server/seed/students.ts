import mongoose from "mongoose";
import dotenv from "dotenv";
import path from "path";
import { Student } from "../models/student";
import { Subject } from "../models/subject";

dotenv.config({ path: path.resolve(__dirname, "../.env") });

interface StudentData {
    studentId: number;
    name: string;
    email: string;
    gpa: number;
    completedSubjects: string[]; // Subject codes
}

const studentsData: StudentData[] = [
    {
        studentId: 2020001,
        name: "Ahmad Hassan",
        email: "ahmad.hassan@university.edu",
        gpa: 3.75,
        completedSubjects: ["MATH110", "MATH131", "MATH170", "STAT100", "PHYS101", "CHEM101", "CS101", "MATH132", "MATH171", "PHYS102"],
    },
    {
        studentId: 2020002,
        name: "Sara Ali",
        email: "sara.ali@university.edu",
        gpa: 3.92,
        completedSubjects: ["MATH110", "MATH131", "MATH170", "STAT100", "PHYS101", "CHEM101", "CS101", "MATH132", "MATH171", "PHYS102", "MATH211", "MATH231", "MATH271", "CS201"],
    },
    {
        studentId: 2020003,
        name: "Omar Khalid",
        email: "omar.khalid@university.edu",
        gpa: 3.21,
        completedSubjects: ["MATH110", "MATH131", "MATH170", "STAT100", "PHYS101", "CS101", "MATH132", "CS201"],
    },
    {
        studentId: 2020004,
        name: "Fatima Abdullah",
        email: "fatima.abdullah@university.edu",
        gpa: 3.88,
        completedSubjects: ["MATH110", "MATH131", "MATH170", "STAT100", "PHYS101", "CHEM101", "CS101", "MATH132", "MATH171", "PHYS102", "MATH211", "MATH231", "MATH271", "CS201", "STAT201", "MATH212", "MATH232", "MATH241"],
    },
    {
        studentId: 2020005,
        name: "Khaled Mohammad",
        email: "khaled.mohammad@university.edu",
        gpa: 2.95,
        completedSubjects: ["MATH110", "MATH131", "MATH170", "STAT100", "CS101", "MATH132"],
    },
    {
        studentId: 2020006,
        name: "Nour Ibrahim",
        email: "nour.ibrahim@university.edu",
        gpa: 3.56,
        completedSubjects: ["MATH110", "MATH131", "MATH170", "STAT100", "PHYS101", "CHEM101", "CS101", "MATH132", "MATH171", "PHYS102", "MATH211", "MATH231", "CS201", "STAT201", "MATH213", "MATH241"],
    },
    {
        studentId: 2020007,
        name: "Layla Osman",
        email: "layla.osman@university.edu",
        gpa: 3.67,
        completedSubjects: ["MATH110", "MATH131", "MATH170", "STAT100", "PHYS101", "CHEM101", "CS101", "MATH132", "MATH171", "PHYS102", "MATH211", "MATH231", "MATH271", "CS201", "STAT201", "MATH232", "MATH272"],
    },
    {
        studentId: 2020008,
        name: "Youssef Adel",
        email: "youssef.adel@university.edu",
        gpa: 3.12,
        completedSubjects: ["MATH110", "MATH131", "MATH170", "STAT100", "PHYS101", "CS101", "MATH132", "MATH211", "CS201"],
    },
    {
        studentId: 2020009,
        name: "Mariam Salah",
        email: "mariam.salah@university.edu",
        gpa: 3.84,
        completedSubjects: ["MATH110", "MATH131", "MATH170", "STAT100", "PHYS101", "CHEM101", "CS101", "MATH132", "MATH171", "PHYS102", "MATH211", "MATH231", "MATH271", "CS201", "STAT201", "MATH212", "MATH213", "MATH232", "MATH241", "MATH272", "CS202"],
    },
    {
        studentId: 2020010,
        name: "Hassan Mostafa",
        email: "hassan.mostafa@university.edu",
        gpa: 3.45,
        completedSubjects: ["MATH110", "MATH131", "MATH170", "STAT100", "PHYS101", "CHEM101", "CS101", "MATH132", "MATH171", "PHYS102", "MATH211", "MATH231", "CS201", "STAT201", "MATH241"],
    },
];

// Helper function to generate a random degree (grade) for a subject
function generateRandomDegree(): number {
    // Generate a random degree between 60 (minimum passing) and 100
    return Math.floor(Math.random() * 41) + 60;
}

async function seedStudents() {
    if (!process.env.MONGO_URI) {
        console.error("MONGO_URI is not set in .env file");
        process.exit(1);
    }

    try {
        await mongoose.connect(process.env.MONGO_URI);
        console.log("Connected to MongoDB");

        // Clear existing students
        await Student.deleteMany({});
        console.log("Cleared existing students");

        // Load all subjects to map codes to ObjectIds
        const subjects = await Subject.find({});
        const codeToIdMap = new Map<string, mongoose.Types.ObjectId>();
        subjects.forEach((subject) => {
            codeToIdMap.set(subject.code, subject._id as mongoose.Types.ObjectId);
        });

        console.log(`Loaded ${subjects.length} subjects for reference`);

        // Create students with completed subjects and academic history
        for (const data of studentsData) {
            // Resolve completed subject codes to ObjectIds
            const completedSubjectIds = data.completedSubjects
                .map(code => codeToIdMap.get(code))
                .filter((id): id is mongoose.Types.ObjectId => id !== undefined);

            if (completedSubjectIds.length !== data.completedSubjects.length) {
                const foundCodes = data.completedSubjects.filter(code => codeToIdMap.has(code));
                const missingCodes = data.completedSubjects.filter(code => !codeToIdMap.has(code));
                console.warn(`Warning: Could not resolve subjects for student ${data.studentId}: ${missingCodes.join(", ")}`);
            }

            // Generate academic history with random degrees for completed subjects
            const academicHistory = data.completedSubjects.map(code => {
                const subjectId = codeToIdMap.get(code);
                return {
                    subject: subjectId,
                    degree: generateRandomDegree(),
                };
            }).filter(entry => entry.subject !== undefined);

            const student = new Student({
                studentId: data.studentId,
                name: data.name,
                email: data.email,
                gpa: data.gpa,
                completedSubjects: completedSubjectIds,
                academicHistory: academicHistory,
            });

            // Set password using virtual setter before saving
            (student as any).password = "Student@123";

            await student.save();
            
            // Log academic history for verification
            const historyLog = academicHistory.map(h => {
                const subjectCode = data.completedSubjects.find(c => codeToIdMap.get(c) === h.subject);
                return `${subjectCode}: ${h.degree}`;
            }).join(", ");
            
            console.log(
                `Created student: ${data.studentId} - ${data.name} | GPA: ${data.gpa} | ` +
                `Completed: ${completedSubjectIds.length} subjects | ` +
                `Academic History: ${historyLog}`
            );
        }

        console.log(`\nSuccessfully seeded ${studentsData.length} students!`);
        console.log("\nNote: All students have been created with default password: 'Student@123'");
    } catch (error) {
        console.error("Error seeding students:", error);
    } finally {
        await mongoose.disconnect();
        console.log("Disconnected from MongoDB");
    }
}

seedStudents();
