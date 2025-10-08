import express from 'express'
import cors from 'cors'
import morgan from 'morgan';
import mongoose from 'mongoose';
import { configDotenv } from 'dotenv';
import { config } from 'dotenv';
import Murid from './models/murid.js';
import Kelas from './models/kelas.js';
import Guru from './models/guru.js';
import WaliKelas from './models/wali_kelas.js';
import MuridKelas from './models/murid_kelas.js';
import jwt from 'jsonwebtoken';
import bcrypt from 'bcrypt';
import Login from './models/login.js';
import Absen from './models/absen.js';

const uri = 'mongodb+srv://Reva:akusuka46@cluster0.d1elhrh.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0';
const port = 3000;
const app = express();
const db = mongoose.connection;
const router = express.Router();
const saltRounds = 10;
const validateMuridId = async (req, res, next) => {
  try {
    const muridId = req.params.id;

    if (!mongoose.Types.ObjectId.isValid(muridId)) {
      return res.status(400).json({ error: 'ID tidak valid' });
    }

    const muridExists = await Murid.exists({ _id: muridId });
    if (!muridExists) {
      return res.status(404).json({ error: 'Murid tidak ditemukan' });
    }

    next();
  } catch (error) {
    console.error('Error dalam middleware validasi:', error);
    res.status(500).json({ error: 'Terjadi kesalahan server' });
  }
};

db.on('error',console.error.bind(console, 'Koneksi Erorr :'));
db.once('open', function(){ 
    console.log('Database Berhasil')
});

mongoose.connect(uri)
  .then(() => {
    console.log('Koneksi ke MongoDB berhasil');
  })
  .catch(err => {
    console.error('Koneksi Error:', err);
  });


app.use(cors());
app.use(morgan('dev'));
app.use(express.json());
app.use(express.urlencoded({ extended: false}));

app.get('/', (req,res) => {
    res.send('Test Sinyal')
})

app.post('/murid/create', (req,res) => {
    const payload = req.body;
    Murid.create(payload).then((data_murid) =>{
            res.status(201).json(data_murid);
        })
        .catch(err => {
            res.status(400).json({ error: err.message });
        });
    })

app.delete('/murid/:id/delete', validateMuridId, async (req, res) => {
  try {
    const muridId = req.params.id;

    const deletedMurid = await Murid.findByIdAndDelete(muridId);
    
    if (!deletedMurid) {
      return res.status(404).json({ error: 'Gagal menghapus murid' });
    }
    
    res.status(200).json({ 
      message: 'Murid berhasil dihapus',
      data: deletedMurid
    });
  } catch (error) {
    console.error('Error menghapus murid:', error);
    res.status(500).json({ error: 'Gagal menghapus murid' });
  }
});

app.get('/murid', async (req, res) => {
    try {
        const data_murid = await Murid.find();
        const jumlahData = data_murid.length;

        res.status(200).json({
            message: "Berhasil mendapatkan data murid",
            jumlah_data: jumlahData,
            data: data_murid 
        });

    } catch (err) {
        console.error('Error:', err); 
        res.status(500).json({ 
            success: false,
            error: "Gagal mendapatkan data murid",
            details: process.env.NODE_ENV === 'development' ? err.message : undefined
        });
    }
});


app.put('/murid/:NISN/update', async (req, res) => {
    try {
        const payload = req.body;
        const NISN = req.params.NISN;

        if (payload.NISN && payload.NISN !== NISN) {
            return res.status(400).json({ 
                error: 'Tidak diperbolehkan mengubah NISN' 
            });
        }

        const updatedMurid = await Murid.findOneAndUpdate(
            { NISN }, 
            { $set: payload },
            { 
                new: true, 
                runValidators: true,
                upsert: false 
            }
        );

        if (!updatedMurid) {
            return res.status(404).json({ 
                error: `Murid dengan NISN ${NISN} tidak ditemukan`,
                success: false 
            });
        }

        res.status(200).json({
            success: true,
            message: 'Data murid berhasil diperbarui',
            data: updatedMurid
        });

    } catch (err) {
        console.error('Error:', err);

        if (err.code === 11000) {
            return res.status(400).json({ 
                error: 'NISN sudah digunakan oleh murid lain',
                success: false 
            });
        }
        
        if (err.name === 'ValidationError') {
            return res.status(400).json({
                error: err.message,
                success: false
            });
        }
        res.status(500).json({
            error: 'Terjadi kesalahan server',
            details: process.env.NODE_ENV === 'development' ? err.message : undefined,
            success: false
        });
    }
});


app.post('/kelas/create', (req,res) => {
    const payload = req.body;
    Kelas.create(payload).then((kelas) =>{
            res.status(201).json(kelas);
        })
        .catch(err => {
            res.status(400).json({ error: err.message });
        });
    })



app.get('/kelas', async (req, res) => {
    try {
        const dataKelas = await Kelas.find({})
            .collation({ locale: 'en', numericOrdering: true })
            .sort({
                'kelas': 1,
                'sub_kelas': 1
            })
            .lean();
        const jumlahData = dataKelas.length;
        const response = {
            status: "Berhasil",
            message: "Data kelas berhasil ditampilkan",
            jumlah_data: jumlahData,
            data: dataKelas.map(kelas => ({
                id: kelas._id,
                kelas: kelas.kelas,
                sub_kelas: kelas.sub_kelas,
                created_at: kelas.createdAt,
                updated_at: kelas.updatedAt
            }))
        };

        res.status(200).json(response);

    } catch (err) {
        console.error('Error:', err);
        res.status(500).json({
            status: "Gagal",
            message: "Terjadi kesalahan saat mengambil data kelas",
            error: process.env.NODE_ENV === 'development' ? {
                message: err.message,
                stack: err.stack
            } : null
        });
    }
});



app.post('/guru/create', (req,res) => {
    const payload = req.body;
    Guru.create(payload).then((guru) =>{
            res.status(201).json(guru);
        })
        .catch(err => {
            res.status(400).json({ error: err.message });
        });
    })

app.get('/guru', async (req, res) => {
    try {
        const guru = await Guru.find();
        const jumlahData = guru.length;

        res.status(200).json({
            message: "Data guru berhasil ditampilkan",
            jumlah_data: jumlahData, 
            data: guru 
        });

    } catch (err) {
        console.error('Error:', err); 
        res.status(500).json({ 
            status: "Gagal", 
            message: "Gagal mendapatkan data guru", 
            error_details: process.env.NODE_ENV === 'development' ? err.message : undefined
        });
    }
});


app.put('/guru/:NIG/update', async (req, res) => {
    try {
        const payload = req.body;
        const NIG = req.params.NIG;

        if (payload.NIG && payload.NIG !== NIG) {
            return res.status(400).json({ 
                error: 'Tidak diperbolehkan mengubah NIG' 
            });
        }

        const updatedGuru = await Guru.findOneAndUpdate(
            { NIG }, 
            { $set: payload },
            { new: true, runValidators: true }
        );

        if (!updatedGuru) {
            return res.status(404).json({ 
                error: `Guru dengan NIG ${NIG} tidak ditemukan` 
            });
        }

        res.status(200).json({
            success: true,
            message: 'Data guru berhasil diperbarui',
            data: updatedGuru
        });

    } catch (err) {
        if (err.code === 11000) {
            return res.status(400).json({ 
                error: 'Data duplikat pada field unik' 
            });
        }
        
        if (err.name === 'ValidationError') {
            return res.status(400).json({ 
                error: err.message 
            });
        }

        res.status(500).json({ 
            error: 'Terjadi kesalahan server',
            details: err.message 
        });
    }
});

app.get('/guru/:id', async (req, res) => {
    try {
        const guru = await Guru.findOne({ _id: req.params.id });
        if (!guru) {
            return res.status(404).json({ message: 'Guru tidak ditemukan' });
        }
        res.json(guru);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

app.post('/wali_kelas', async (req, res) => {
    try {
        const { id_guru, id_kelas } = req.body;

        if (!mongoose.Types.ObjectId.isValid(id_guru) || !mongoose.Types.ObjectId.isValid(id_kelas)) {
            return res.status(400).json({ message: 'ID tidak valid' });
        }

        const [guru, kelas] = await Promise.all([
            Guru.findById(id_guru),
            Kelas.findById(id_kelas)
        ]);

        if (!guru) {
            return res.status(404).json({ message: 'Guru tidak ditemukan' });
        }
        if (!kelas) {
            return res.status(404).json({ message: 'Kelas tidak ditemukan' });
        }

        const existingWali = await WaliKelas.findOne({ id_kelas });
        if (existingWali) {
            return res.status(400).json({
                message: 'Kelas ini sudah memiliki wali kelas',
                current_wali: existingWali.id_guru
            });
        }


        const guruAsWali = await WaliKelas.findOne({ id_guru });
        if (guruAsWali) {
            return res.status(400).json({
                message: 'Guru ini sudah menjadi wali kelas di kelas lain',
                current_class: guruAsWali.id_kelas
            });
        }

        const waliKelas = new WaliKelas({
            id_guru: guru._id,
            id_kelas: kelas._id
        });
        await waliKelas.save();

        const result = await WaliKelas.findById(waliKelas._id)
            .populate('id_guru', 'nama NIG')
            .populate('id_kelas', 'kelas sub_kelas');

        res.status(201).json({
            message: 'Wali kelas berhasil ditambahkan',
            data: result
        });

    } catch (error) {
        console.error('Error:', error);
        res.status(500).json({
            message: 'Terjadi kesalahan server',
            error: error.message
        });
    }
});

app.get('/wali_kelas', async (req, res) => {
    try {
        const { guruId, kelasId } = req.query;
        let query = {};

        if (guruId) {
            if (!mongoose.Types.ObjectId.isValid(guruId)) {
                return res.status(400).json({ message: 'ID guru tidak valid' });
            }
            query.id_guru = guruId;
        }

        if (kelasId) {
            if (!mongoose.Types.ObjectId.isValid(kelasId)) {
                return res.status(400).json({ message: 'ID kelas tidak valid' });
            }
            query.id_kelas = kelasId;
        }
        const waliKelasList = await WaliKelas.find(query)
            .populate('id_guru', 'nama NIG')
            .populate('id_kelas', 'kelas sub_kelas');

        res.status(200).json({
            message: 'Data wali kelas berhasil diambil',
            count: waliKelasList.length,
            data: waliKelasList
        });

    } catch (error) {
        console.error('Error:', error);
        res.status(500).json({
            message: 'Terjadi kesalahan server',
            error: error.message
        });
    }
});


app.post('/murid_kelas/add', async (req, res) => {
    try {
        const { id_murid, id_kelas } = req.body;

        if (!mongoose.Types.ObjectId.isValid(id_murid) || !mongoose.Types.ObjectId.isValid(id_kelas)) {
            return res.status(400).json({ message: 'ID tidak valid' });
        }

        const [murid, kelas] = await Promise.all([
            Murid.findById(id_murid),
            Kelas.findById(id_kelas)
        ]);

        if (!murid) {
            return res.status(404).json({ message: 'Murid tidak ditemukan' });
        }
        if (!kelas) {
            return res.status(404).json({ message: 'Kelas tidak ditemukan' });
        }

        const existingMuridKelas = await MuridKelas.findOne({ id_murid, id_kelas });
        if (existingMuridKelas) {
            return res.status(400).json({
                message: 'Murid ini sudah terdaftar di kelas ini'
            });
        }

        const newMuridKelas = new MuridKelas({
            id_murid,
            id_kelas
        });
        await newMuridKelas.save();

        const populatedMuridKelas = await MuridKelas.findById(newMuridKelas._id)
            .populate('id_murid', 'nama')
            .populate('id_kelas', 'kelas sub_kelas');

        res.status(201).json({
            message: 'Murid berhasil ditambahkan ke kelas',
            data: {
                murid: {
                    id: populatedMuridKelas.id_murid._id,
                    nama: populatedMuridKelas.id_murid.nama
                },
                kelas: {
                    id: populatedMuridKelas.id_kelas._id,
                    kelas: populatedMuridKelas.id_kelas.kelas,
                    sub_kelas: populatedMuridKelas.id_kelas.sub_kelas
                },
                tanggal_ditambahkan: populatedMuridKelas.createdAt
            }
        });

    } catch (error) {
        console.error('Error:', error);
        res.status(500).json({
            message: 'Terjadi kesalahan server',
            error: error.message
        });
    }
});

app.get('/murid_kelas', async (req, res) => {
    try {
        const semuaMuridKelas = await MuridKelas.find()
            .populate({
                path: 'id_murid',
                select: 'nama NIS' 
            })
            .populate({
                path: 'id_kelas',
                select: 'kelas sub_kelas wali_kelas' 
            })
            .sort({ createdAt: -1 }); 

        const response = semuaMuridKelas.map(item => ({
            id: item._id,
            murid: {
                id: item.id_murid._id,
                nama: item.id_murid.nama,
                NIS: item.id_murid.NIS
            },
            kelas: {
                id: item.id_kelas._id,
                nama_kelas: `${item.id_kelas.kelas} ${item.id_kelas.sub_kelas}`,
                wali_kelas: item.id_kelas.wali_kelas
            },
            tanggal_bergabung: item.createdAt
        }));
        const jumlahSiswa = semuaMuridKelas.length;
        const jumlahSiswaText = `${jumlahSiswa} Siswa/Siswi`;
        res.status(200).json({
            Jumlah : jumlahSiswaText,
            data: response
        });

    } catch (error) {
        console.error('Error:', error);
        res.status(500).json({
            success: false,
            message: 'Terjadi kesalahan server',
            error: error.message
        });
    }
});

app.post("/register", async (req, res) => {
    try {
        const { NIG, password } = req.body;
        if (!NIG || !password) {
            return res.status(400).json({ error: "NIG dan password wajib diisi" });
        }
        const guru = await Guru.findOne({ NIG });
        if (!guru) {
            return res.status(404).json({ error: "Guru dengan NIG tersebut tidak ditemukan" });
        }
        const existingLogin = await Login.findOne({ NIG });
        if (existingLogin) {
            return res.status(409).json({ error: "Akun login untuk NIG ini sudah ada" });
        }
        const passwordHash = await bcrypt.hash(password, saltRounds);
        const newLogin = new Login({
            NIG,
            password: passwordHash,
            guru: guru._id
        });
        
        await newLogin.save();
        const populatedLogin = await Login.findById(newLogin._id).populate('guru');
        res.status(201).json({
            message: "Akun login berhasil dibuat",
            data: {
                NIG: populatedLogin.NIG,
                guru: populatedLogin.guru
            }
        });
    } catch (error) {
        console.error("Error register:", error);
        res.status(500).json({ error: "Server error: " + error.message });
    }
});

app.post("/login", async (req, res) => {
    try {
        const { NIG, password } = req.body;
        if (!NIG || !password) {
            return res.status(400).json({ error: "NIG dan password wajib diisi" });
        }
        const login = await Login.findOne({ NIG }).populate('guru');
        if (!login) {
            return res.status(401).json({ error: "NIG tidak ditemukan" });
        }
        const passwordValid = await bcrypt.compare(password, login.password);
        if (!passwordValid) {
            return res.status(401).json({ error: "Password salah" });
        }
        res.status(200).json({
            message: "Login berhasil",
            data: {
                NIG: login.NIG,
                guru: login.guru
            }
        });
    } catch (error) {
        console.error("Error login:", error);
        res.status(500).json({ error: "Server error: " + error.message });
    }
});

app.get("/:NIG", async (req, res) => {
    try {
        const { NIG } = req.params;
        const login = await Login.findOne({ NIG }).populate('guru');
        if (!login) {
            return res.status(404).json({ error: "Akun login tidak ditemukan" });
        }
        res.status(200).json({
            message: "Data akun ditemukan",
            data: {
                NIG: login.NIG,
                guru: login.guru 
            }
        });
    } catch (error) {
        console.error("Error GET login:", error);
        res.status(500).json({ error: "Server error: " + error.message });
    }
});

app.put("/:NIG", async (req, res) => {
    try {
        const { NIG } = req.params;
        const { oldPassword, newPassword } = req.body;
        if (!oldPassword || !newPassword) {
            return res.status(400).json({ error: "Password lama dan baru wajib diisi" });
        }
        const login = await Login.findOne({ NIG }).populate('guru');
        if (!login) {
            return res.status(404).json({ error: "Akun login tidak ditemukan" });
        }
        const oldPasswordValid = await bcrypt.compare(oldPassword, login.password);
        if (!oldPasswordValid) {
            return res.status(401).json({ error: "Password lama salah" });
        }
        const newPasswordHash = await bcrypt.hash(newPassword, saltRounds);
        login.password = newPasswordHash;
        await login.save();
        res.status(200).json({
            message: "Password berhasil diupdate",
            data: {
                NIG: login.NIG,
                guru: login.guru
            }
        });
    } catch (error) {
        console.error("Error UPDATE login:", error);
        res.status(500).json({ error: "Server error: " + error.message });
    }
});
app.get("/login/akun", async (req, res) => {
    try {
        const logins = await Login.find().populate('guru');
        res.status(200).json({
            message: "Daftar akun login",
            data: logins.map(login => ({
                NIG: login.NIG,
                guru: login.guru
            }))
        });
    } catch (error) {
        console.error("Error GET all logins:", error);
        res.status(500).json({ error: "Server error: " + error.message });
    }
});

app.post("/absen", async (req, res) => {
      try {
          const { NIS, id_kelas, tanggal, status } = req.body;
          if (!NIS || !id_kelas || !tanggal || !status) {
              return res.status(400).json({ 
                  error: "NIS, id_kelas, tanggal, dan status wajib diisi"
              });
          }
          const validStatuses = ['Hadir', 'Tidak Hadir', 'Izin', 'Sakit'];
          if (!validStatuses.includes(status)) {
              return res.status(400).json({ 
                  error: `Status harus salah satu: ${validStatuses.join(', ')}` 
              });
          }
          const murid = await Murid.findOne({ NIS });
          if (!murid) {
              return res.status(404).json({ 
                  error: "Siswa dengan NIS tersebut tidak ditemukan"
              });
          } const kelas = await Kelas.findById(id_kelas);
          if (!kelas) {
              return res.status(404).json({ 
                  error: "Kelas dengan ID tersebut tidak ditemukan" 
              });
          }
          const existingAbsen = await Absen.findOne({ 
              NIS,
              tanggal: { $eq: new Date(tanggal).toDateString() }
          });
          if (existingAbsen) {
              return res.status(409).json({ 
                  error: "Absen untuk siswa ini pada tanggal tersebut sudah ada" 
              });
          }
          const newAbsen = new Absen({
              NIS, 
              id_kelas,
              tanggal: new Date(tanggal),
              status
          });
          await newAbsen.save();
          const populatedAbsen = await Absen.findById(newAbsen._id)
              .populate('id_kelas', 'nama');
          res.status(201).json({
              message: "Absen berhasil dibuat",
              data: {
                  _id: populatedAbsen._id,
                  NIS: populatedAbsen.NIS,
                  id_kelas: populatedAbsen.id_kelas,
                  tanggal: populatedAbsen.tanggal,
                  status: populatedAbsen.status,
                  createdAt: populatedAbsen.createdAt
              }
          });
      } catch (error) {
          console.error("Error membuat absen:", error);
          res.status(500).json({ 
              error: "Server error: " + error.message 
          });
      }
  });

app.listen(port, () => {
    console.log(`Server launced on port ${port}`)
})