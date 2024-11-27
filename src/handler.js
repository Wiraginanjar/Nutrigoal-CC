const pool = require('./database');
const books = require('./books');

const queryTable = async (request, h) => {
    try {
      const [rows] = await pool.query('SHOW tables;');
      return h.response(rows).code(200);
    } catch (error) {
      console.error(error);
      return h.response({ error: 'Failed to fetch users' }).code(500);
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
};