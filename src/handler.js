const pool = require('./database');
const inputs = require('./inputs');
const bcrypt = require('bcrypt');
const axios = require('axios');

const queryTable = async (request, h) => {
    try {
        const [rows] = await pool.query('SHOW tables;');
        return h.response(rows).code(200);
    } catch (error) {
        console.error(error);
        return h.response({ error: 'Failed to fetch users' }).code(500);
    }
};


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

const proxyPredict = async (request, h) => {
    const body = request.payload; // Mengambil body request yang dikirimkan ke server Hapi.js

    try {
        // Mengirim body tersebut ke API tujuan
        const response = await axios.post('https://model-nutrigoal-usbd2ygyiq-as.a.run.app/predictjson', body);

        // Mengembalikan response dari API tujuan
        let data = response.data;
        
        let ffn_name_val = JSON.stringify(data.favorite_food_name.ffn_name);
        await pool.query('INSERT INTO favorite_food_name (ffn_name) VALUES (?)', [ffn_name_val]);

        let ffp_id_val = JSON.stringify(data.favorite_food_preference.ffp_id);
        let ffn_id_val = JSON.stringify(data.favorite_food_preference.ffn_id);
        let ffp_name_val = JSON.stringify(data.favorite_food_preference.ffp_name);
        await pool.query('INSERT INTO favorite_food_preference (ffp_id, ffn_id, ffp_name) VALUES (?, ?, ?)', [ffp_id_val, ffn_id_val, ffp_name_val]);

        //let rfboc_col = Object.keys(data.recommended_food_based_on_calories).join(", ").replaceAll("(", "").replaceAll(")", "");
        let rfboc_val = Object.values(data.recommended_food_based_on_calories).filter((_, index) => index !== 10); // ignore rfboc_id because auto increment (not unique)
        await pool.query(
            `INSERT INTO recommended_food_based_on_calories 
             (
                rfboc_activity_level, rfboc_age, rfboc_bmi, rfboc_bmr, 
                rfboc_created_at, rfboc_daily_calorie_needs, rfboc_diet_type, 
                rfboc_gender, rfboc_height_cm, rfboc_history_of_gastritis_or_gerd, 
                rfboc_ideal_bmi, rfboc_ideal_weight, rfboc_meal_schedule_day, 
                rfboc_total_calories_by_recommendation, rfboc_total_carbohydrate_g, 
                rfboc_total_cholesterol_mg, rfboc_total_fat_g, rfboc_total_fiber_g, 
                rfboc_total_protein_g, rfboc_total_saturated_fat_g, rfboc_total_sodium_mg, 
                rfboc_total_sugar_g, rfboc_updated_at, rfboc_weight_kg, 
                rfboc_weight_difference, user_id
             ) 
             VALUES 
             (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
             rfboc_val
          );
        //let rfp_col = Object.keys(data.recommended_food_preference).join(", ").replaceAll("(", "").replaceAll(")", "");
        //console.log(rfp_col);
        let rfp_val = Object.values(data.recommended_food_preference);
        //console.log(rfp_val.length);
        //console.log(Object.keys(rfp_val[5]).join(", ").replaceAll("(", "_").replaceAll(")", "").toLowerCase());
        for (let i = 0; i < rfp_val.length; i++) {
            try {
                await pool.query(
                    `INSERT INTO recommended_food_preference 
                    (
                        calories, carbohydrate_g, cholesterol_mg, 
                        fat_g, fiber_g, name, protein_g, saturated_fat_g, 
                        sodium_mg, sugar_g, ffp_id, rfboc_id, rfp_created_at, 
                        rfp_id, rfp_updated_at
                    ) 
                    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`, Object.values(rfp_val[i]));
                    //console.log(`Data ke-${i + 1} berhasil dimasukkan`);
            } catch (error) {
                console.error(`Gagal memasukkan data ke-${i + 1}:`, error);
            }
        }
        // await pool.query('INSERT INTO history_recommendation_food_per_day (...) VALUES (?)', Object.values(history_recommendation_food_per_day));
        // await pool.query('INSERT INTO history_food_recommendation (...) VALUES (?)', Object.values(history_food_recommendation));

        return h.response(response.data).code(response.status);
    } catch (error) {
        console.error('Error:', error.message);
        return h.response({ error: 'Failed to forward request to API' }).code(500);
    }
}

const getAllBooksModule = (request, h) => {
    const { name, reading, finished } = request.query;

    let filteredBooks = books;

    if (name) {
        filteredBooks = filteredBooks.filter((book) =>
            book.name.toLowerCase().includes(name.toLowerCase())
        );
    }

    if (reading !== undefined) {
        const isReading = reading === '1';
        filteredBooks = filteredBooks.filter((book) => book.reading === isReading);
    }

    if (finished !== undefined) {
        const isFinished = finished === '1';
        filteredBooks = filteredBooks.filter((book) => book.finished === isFinished);
    }

    const booksToReturn = filteredBooks.map(({ id, name, publisher }) => ({
        id, name, publisher
    }));

    const response = h.response({
        status: 'success',
        data: {
            books: booksToReturn,
        },
    });
    response.code(200);
    return response;
};

const getBookByIdModule = (request, h) => {
    const { id } = request.params;

    const book = books.filter((n) => n.id === id)[0];
    if (book !== undefined) {
        return {
            status: 'success',
            data: {
            book,
            },
        };
    }
    const response = h.response({
        status: 'fail',
        message: 'Buku tidak ditemukan',
    });
    response.code(404);
    return response;
};

const editBookByIdModule = (request, h) => {
    const { id } = request.params;

    const { 
        name, year, author, summary, publisher,
        pageCount, readPage, reading
    } = request.payload;

    const updatedAt = new Date().toISOString();
    const index = books.findIndex((book) => book.id === id);

    books[index] = {
        ...books[index],
        name,
        year,
        author,
        summary,
        publisher,
        pageCount,
        readPage,
        reading,
        updatedAt,
    };

    const isBookEmpty = !name || name.trim() === '';

    if (index === -1) {
        const response = h.response({
            status: 'fail',
            message: 'Gagal memperbarui buku. Id tidak ditemukan',
        });
        response.code(404);
        return response;
    }
    if (isBookEmpty){
        const response = h.response({
            'status': 'fail',
            'message': 'Gagal memperbarui buku. Mohon isi nama buku'
        });
        response.code(400);
        return response;
    }
    if (readPage > pageCount)
    {
        const response = h.response({
            'status': 'fail',
            'message': 'Gagal memperbarui buku. readPage tidak boleh lebih besar dari pageCount'
        });
        response.code(400);
        return response;    
    }
    const response = h.response({
        status: 'success',
        message: 'Buku berhasil diperbarui',
    });
    response.code(200);
    return response;
};

const deleteBookByIdModule = (request, h) => {
    const { id } = request.params;

    const index = books.findIndex((book) => book.id === id);

    if (index === -1) {
        const response = h.response({
            status: 'fail',
            message: 'Buku gagal dihapus. Id tidak ditemukan',
        });
        response.code(404);
        return response;
    }
    books.splice(index, 1);
    const response = h.response({
    status: 'success',
    message: 'Buku berhasil dihapus',
    });
    response.code(200);
    return response;
};

module.exports = { 
    queryTable, 
    getAllBooksModule, 
    getBookByIdModule, 
    editBookByIdModule,
    deleteBookByIdModule,
    registerUser,
    loginUser,
    updateUser,
    proxyPredict,
};