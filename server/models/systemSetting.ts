import mongoose, { Schema, Document } from 'mongoose';

export interface ISystemSetting extends Document {
    registrationOpen: boolean;
    withdrawalOpen: boolean;
}

const systemSettingSchema = new Schema<ISystemSetting>({
    registrationOpen: {
        type: Boolean,
        default: true
    },
    withdrawalOpen: {
        type: Boolean,
        default: true
    }
}, {
    timestamps: true
});

const SystemSetting = mongoose.model<ISystemSetting>('SystemSetting', systemSettingSchema);
export default SystemSetting;
