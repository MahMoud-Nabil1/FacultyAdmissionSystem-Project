import { Request, Response } from "express";
import { Place } from "../models/place";

export const createPlace = async (req: Request, res: Response): Promise<void> => {
    try {
        const place = new Place(req.body);
        await place.save();
        res.status(201).json(place);
    } catch (err: unknown) {
        if (err instanceof Error) {
            res.status(400).json({ error: err.message });
        } else {
            res.status(400).json({ error: "Unknown error" });
        }
    }
};

export const getAllPlaces = async (req: Request, res: Response): Promise<void> => {
    try {
        const places = await Place.find().sort({ name: 1 });
        res.json(places);
    } catch (err: unknown) {
        if (err instanceof Error) {
            res.status(500).json({ error: err.message });
        } else {
            res.status(500).json({ error: "Unknown error" });
        }
    }
};

export const getPlaceById = async (req: Request, res: Response): Promise<void> => {
    try {
        const place = await Place.findById(req.params.id);
        if (!place) {
            res.status(404).json({ error: "Place not found" });
            return;
        }
        res.json(place);
    } catch (err: unknown) {
        if (err instanceof Error) {
            res.status(500).json({ error: err.message });
        } else {
            res.status(500).json({ error: "Unknown error" });
        }
    }
};

export const updatePlace = async (req: Request, res: Response): Promise<void> => {
    try {
        const place = await Place.findByIdAndUpdate(
            req.params.id,
            req.body,
            { new: true, runValidators: true }
        );
        if (!place) {
            res.status(404).json({ error: "Place not found" });
            return;
        }
        res.json(place);
    } catch (err: unknown) {
        if (err instanceof Error) {
            res.status(400).json({ error: err.message });
        } else {
            res.status(400).json({ error: "Unknown error" });
        }
    }
};

export const deletePlace = async (req: Request, res: Response): Promise<void> => {
    try {
        const place = await Place.findByIdAndDelete(req.params.id);
        if (!place) {
            res.status(404).json({ error: "Place not found" });
            return;
        }
        res.json({ message: "Place deleted successfully" });
    } catch (err: unknown) {
        if (err instanceof Error) {
            res.status(500).json({ error: err.message });
        } else {
            res.status(500).json({ error: "Unknown error" });
        }
    }
};
