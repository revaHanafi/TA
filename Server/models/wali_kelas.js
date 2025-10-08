import mongoose from "mongoose";
import Guru from "./guru.js";
import Kelas from "./kelas.js";

const Schema = mongoose.Schema;

const WaliKelasSchema = new Schema({
    id_guru: { 
        type: mongoose.Schema.Types.ObjectId, 
        ref: 'Guru', 
        required: true 
    },
    id_kelas: { 
        type: mongoose.Schema.Types.ObjectId, 
        ref: 'Kelas', 
        required: true 
    }
}, {
    timestamps: true,
    indexes: [{ 
        unique: true, 
        fields: ['id_guru', 'id_kelas'] 
    }]
});

async function addWaliKelas(req, res) {
    const { id_guru, id_kelas } = req.body;
    try {
        const guru = await Guru.findById(id_guru);
        const kelas = await Kelas.findById(id_kelas);
        if (!guru || !kelas) {
            return res.status(404).json({ error: 'Guru atau kelas tidak ditemukan' });
        }

        const existingWaliKelas = await Wali_Kelas.findOne({ id_guru, id_kelas });
        if (existingWaliKelas) {
            return res.status(400).json({ error: 'Wali kelas untuk kombinasi ini sudah ada' });
        }

        const waliKelas = new Wali_Kelas({ id_guru, id_kelas });
        await waliKelas.save();
        res.status(201).json({ success: true, data: waliKelas });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
}

const Wali_Kelas = mongoose.model("Wali_kelas", WaliKelasSchema);

export default Wali_Kelas;
