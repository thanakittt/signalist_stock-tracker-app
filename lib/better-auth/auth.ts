import { betterAuth } from "better-auth";
import { mongodbAdapter } from "better-auth/adapters/mongodb";
import { connectToDatabase } from "@/database/mongoose";
import {nextCookies} from "better-auth/next-js"

let authInstanc: ReturnType<typeof betterAuth> | null = null;

export const getAuth = async () => {
    if(authInstanc) return authInstanc;

    const mongoose = await connectToDatabase();
    const db = mongoose.connection.db;

    if(!db) throw new Error("MongoDB connection error");

    authInstanc = betterAuth({
        database: mongodbAdapter(db),
        secret: process.env.BETTER_AUTH_SECRET,
        baseURL: process.env.BETTER_AUTH_URL,
        emailAndPassword: {
            enabled: true,
            disableSignUp: false,
            requireEmailVerification: false,
            maxPasswordLength: 128,
            minPasswordLength: 8,
            autoSignIn: true,
        },
        plugins: [nextCookies()]
    })

    return authInstanc;
}

export const auth = await getAuth();