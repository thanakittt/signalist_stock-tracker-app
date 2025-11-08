"use server";

import { connectToDatabase } from "@/database/mongoose";
import Watchlist from "@/database/models/watchlist.model";

export const getWatchlistSymbolsByEmail = async (
  email: string
): Promise<string[]> => {
  try {
    const mongoose = await connectToDatabase();
    const db = mongoose.connection.db;

    if (!db) {
      throw new Error("Mongoose connection not connected");
    }

    // Find user by email in Better Auth user collection
    const usersCollection = db.collection("user");
    const user = await usersCollection.findOne({ email });

    if (!user) {
      return [];
    }

    const userId = user.id || user._id.toString();

    // Query watchlist by userId and return symbols
    const watchlistItems = await Watchlist.find({ userId }).select("symbol");

    return watchlistItems.map((item) => item.symbol);
  } catch (error) {
    console.error("Error fetching watchlist symbols:", error);
    return [];
  }
};
