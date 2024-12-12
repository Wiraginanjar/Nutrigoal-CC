const pool = require('./database');
const crypto = require('crypto');
const bcrypt = require('bcrypt');
const axios = require('axios');
const { storeData, getData } = require('./storeData');

const registerUser = async (request, h) => {
    const { name, email, password } = request.payload;

    // Validasi input
    if (!name || !email || !password) {
        return h.response({ error: 'Please fill all the form' }).code(400);
    }

    try {
        // Hash password sebelum disimpan
        const hashedPassword = await bcrypt.hash(password, 10);

        // Simpan user baru ke database
        await pool.query('INSERT INTO users_public (name, email, password) VALUES (?, ?, ?)', [name, email, hashedPassword]);

        // Respons sukses
        return h.response({ message: 'User registered successfully!' }).code(201);
    } catch (error) {
        console.error(error);

        // Penanganan error jika email sudah terdaftar
        if (error.code === 'ER_DUP_ENTRY') {
            return h.response({ error: 'Email already exists' }).code(409);
        }

        // Penanganan error umum
        return h.response({ error: 'Failed to register user' }).code(500);
    }
};

const loginUser = async (request, h) => {
    const { email, password } = request.payload;

    // Validasi input
    if (!email || !password) {
        return h.response({ error: 'Please provide email and password' }).code(400);
    }

    try {
        // Query untuk mencari user berdasarkan email
        const [rows] = await pool.query('SELECT * FROM user WHERE email = ?;', [email]);

        // Jika user tidak ditemukan
        if (rows.length === 0) {
            return h.response({ error: 'Invalid email or password' }).code(401); // Unauthorized
        }

        const user = rows[0];

        // Verifikasi password
        const isPasswordValid = await bcrypt.compare(password, user.password);
        if (!isPasswordValid) {
            return h.response({ error: 'Invalid email or password' }).code(401); // Unauthorized
        }

        // Jika login berhasil
        return h.response({
            message: 'Login successful!',
            user: {
                id: user.id,
                name: user.name,
                email: user.email,
            },
        }).code(200);
    } catch (error) {
        console.error(error);
        return h.response({ error: 'Failed to login user' }).code(500);
    }
};

const updateUser = async (request, h) => {
    const { id } = request.params;
    const { email, gender, name, dateOfBirth } = request.payload;

    // Validasi input
    if (!id || (!email && !gender && !name && !dateOfBirth)) {
        return h.response({ error: 'Provide at least one field to update' }).code(400);
    }

    try {
        // Array untuk menyimpan bagian query dan nilai parameter
        const updates = [];
        const values = [];

        // Tambahkan field yang ingin di-update ke query
        if (email) {
            updates.push('email = ?');
            values.push(email);
        }
        if (gender) {
            updates.push('gender = ?');
            values.push(gender);
        }
        if (name) {
            updates.push('name = ?');
            values.push(name);
        }
        if (dateOfBirth) {
            updates.push('dateOfBirth = ?');
            values.push(dateOfBirth);
        }

        // Tambahkan ID user ke parameter
        values.push(id);

        // Bangun query SQL
        const query = `UPDATE user SET ${updates.join(', ')} WHERE id = ?;`;

        // Eksekusi query dengan pool.execute
        const [result] = await pool.query(query, values);

        // Periksa apakah ada baris yang diperbarui
        if (result.affectedRows === 0) {
            return h.response({ error: 'User not found or no changes made' }).code(404);
        }

        return h.response({ message: 'User updated successfully!' }).code(200);
    } catch (error) {
        console.error(error);
        return h.response({ error: 'Failed to update user' }).code(500);
    }
};

const getpredict = async (request, h) => {
    const body = request.payload; // Mengambil body request yang dikirimkan ke server Hapi.js

    try {
        // Mengirim body tersebut ke API tujuan
        const response = await axios.post('https://nutrigoal-ml-1024521178030.asia-southeast2.run.app/predictjson', body);

        // Mengembalikan response dari API tujuan
        let data = response.data;
        const id = crypto.randomUUID();
        await storeData(id, data);

        return h.response(response.data).code(response.status);
    } catch (error) {
        console.error('Error:', error.message);
        return h.response({ error: 'Failed to forward request to API' }).code(500);
    }
}

async function getHistory(request, h) {
    try {
      const maps = await getData(); 
      
      const response = h.response({
        status: 'success',
        data: maps
      });
      response.code(200);
      return response;
    } catch (error) {
      console.error('Error fetching history:', error); // Log the error for debugging
      const response = h.response({
        status: 'fail',
        message: 'Terjadi kesalahan saat mengambil riwayat prediksi',
      });
      response.code(500);
      return response;
    }
  }

module.exports = { 
    registerUser,
    loginUser,
    updateUser,
    getpredict,
    getHistory
};