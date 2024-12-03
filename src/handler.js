const pool = require('./database');
const inputs = require('./inputs');
const bcrypt = require('bcrypt');

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
        await pool.execute('INSERT INTO users_public (name, email, password) VALUES (?, ?, ?)', [name, email, hashedPassword]);

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
};