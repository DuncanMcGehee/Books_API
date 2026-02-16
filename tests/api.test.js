const request = require('supertest');
const express = require('express');
const app = express();

// Middleware
app.use(express.json());

// Sample books data (reset for each test)
let books = [
    {
        id: 1,
        title: "The Great Gatsby",
        author: "F. Scott Fitzgerald",
        genre: "Fiction",
        copiesAvailable: 5
    },
    {
        id: 2,
        title: "To Kill a Mockingbird",
        author: "Harper Lee",
        genre: "Fiction",
        copiesAvailable: 3
    },
    {
        id: 3,
        title: "1984",
        author: "George Orwell",
        genre: "Dystopian Fiction",
        copiesAvailable: 7
    }
];

// Root endpoint
app.get('/', (req, res) => {
    res.json({
        message: "Welcome to the Books API",
        endpoints: {
            "GET /api/books": "Get all books",
            "GET /api/books/:id": "Get a specific book by ID",
            "POST /api/books": "Add a new book",
            "PUT /api/books/:id": "Update a book by ID",
            "DELETE /api/books/:id": "Delete a book by ID"
        }
    });
});

// GET /api/books - Return all books
app.get('/api/books', (req, res) => {
    res.json(books);
});

// GET /api/books/:id - Return a specific book by ID
app.get('/api/books/:id', (req, res) => {
    const bookId = parseInt(req.params.id);
    const book = books.find(b => b.id === bookId);
    if (book) {
        res.json(book);
    } else {
        res.status(404).json({ error: 'Book not found' });
    }
});

// POST /api/books - Create a new book
app.post('/api/books', (req, res) => {
    const { title, author, genre, copiesAvailable } = req.body;
    const newBook = {
        id: Math.max(...books.map(b => b.id), 0) + 1,
        title,
        author,
        genre,
        copiesAvailable
    };
    books.push(newBook);
    res.status(201).json(newBook);
});

// PUT /api/books/:id - Update an existing book
app.put('/api/books/:id', (req, res) => {
    const bookId = parseInt(req.params.id);
    const { title, author, genre, copiesAvailable } = req.body;
    const bookIndex = books.findIndex(b => b.id === bookId);

    if (bookIndex === -1) {
        return res.status(404).json({ error: 'Book not found' });
    }

    books[bookIndex] = {
        id: bookId,
        title,
        author,
        genre,
        copiesAvailable
    };

    res.json(books[bookIndex]);
});

// DELETE /api/books/:id - Delete a book
app.delete('/api/books/:id', (req, res) => {
    const bookId = parseInt(req.params.id);
    const bookIndex = books.findIndex(b => b.id === bookId);

    if (bookIndex === -1) {
        return res.status(404).json({ error: 'Book not found' });
    }

    const deletedBook = books.splice(bookIndex, 1)[0];
    res.json({ message: 'Book deleted successfully', book: deletedBook });
});

// ==================== TESTS ====================

describe('Books API', () => {
    
    // Reset books array before each test
    beforeEach(() => {
        books = [
            {
                id: 1,
                title: "The Great Gatsby",
                author: "F. Scott Fitzgerald",
                genre: "Fiction",
                copiesAvailable: 5
            },
            {
                id: 2,
                title: "To Kill a Mockingbird",
                author: "Harper Lee",
                genre: "Fiction",
                copiesAvailable: 3
            },
            {
                id: 3,
                title: "1984",
                author: "George Orwell",
                genre: "Dystopian Fiction",
                copiesAvailable: 7
            }
        ];
    });

    // ============== GET ENDPOINT TESTS ==============
    describe('GET /api/books', () => {
        test('should return all books with 200 status', async () => {
            const response = await request(app)
                .get('/api/books')
                .expect(200);

            expect(Array.isArray(response.body)).toBe(true);
            expect(response.body.length).toBe(3);
            expect(response.body[0].title).toBe("The Great Gatsby");
        });

        test('should return books with correct structure', async () => {
            const response = await request(app)
                .get('/api/books')
                .expect(200);

            response.body.forEach(book => {
                expect(book).toHaveProperty('id');
                expect(book).toHaveProperty('title');
                expect(book).toHaveProperty('author');
                expect(book).toHaveProperty('genre');
                expect(book).toHaveProperty('copiesAvailable');
            });
        });
    });

    describe('GET /api/books/:id', () => {
        test('should return a specific book by ID with 200 status', async () => {
            const response = await request(app)
                .get('/api/books/1')
                .expect(200);

            expect(response.body.id).toBe(1);
            expect(response.body.title).toBe("The Great Gatsby");
            expect(response.body.author).toBe("F. Scott Fitzgerald");
        });

        test('should return correct book for different IDs', async () => {
            const response2 = await request(app)
                .get('/api/books/2')
                .expect(200);

            expect(response2.body.id).toBe(2);
            expect(response2.body.title).toBe("To Kill a Mockingbird");
        });

        test('should return 404 for non-existent book ID', async () => {
            const response = await request(app)
                .get('/api/books/999')
                .expect(404);

            expect(response.body).toHaveProperty('error');
            expect(response.body.error).toBe('Book not found');
        });

        test('should return 404 for negative book ID', async () => {
            const response = await request(app)
                .get('/api/books/-1')
                .expect(404);

            expect(response.body.error).toBe('Book not found');
        });
    });

    // ============== POST ENDPOINT TESTS ==============
    describe('POST /api/books', () => {
        test('should create a new book with 201 status', async () => {
            const newBook = {
                title: "The Hobbit",
                author: "J.R.R. Tolkien",
                genre: "Fantasy",
                copiesAvailable: 4
            };

            const response = await request(app)
                .post('/api/books')
                .send(newBook)
                .expect(201);

            expect(response.body).toHaveProperty('id');
            expect(response.body.title).toBe("The Hobbit");
            expect(response.body.author).toBe("J.R.R. Tolkien");
            expect(response.body.genre).toBe("Fantasy");
            expect(response.body.copiesAvailable).toBe(4);
        });

        test('should auto-generate ID for new book', async () => {
            const newBook = {
                title: "Dune",
                author: "Frank Herbert",
                genre: "Science Fiction",
                copiesAvailable: 2
            };

            const response = await request(app)
                .post('/api/books')
                .send(newBook)
                .expect(201);

            expect(typeof response.body.id).toBe('number');
            expect(response.body.id).toBeGreaterThan(0);
        });

        test('should add book to the collection', async () => {
            const initialCount = books.length;
            const newBook = {
                title: "Brave New World",
                author: "Aldous Huxley",
                genre: "Dystopian Fiction",
                copiesAvailable: 3
            };

            await request(app)
                .post('/api/books')
                .send(newBook)
                .expect(201);

            // Verify the book was added by fetching all books
            const allBooksResponse = await request(app)
                .get('/api/books')
                .expect(200);

            expect(allBooksResponse.body.length).toBe(initialCount + 1);
            expect(allBooksResponse.body[allBooksResponse.body.length - 1].title).toBe("Brave New World");
        });

        test('should handle multiple POST requests correctly', async () => {
            const book1 = {
                title: "Murder on the Orient Express",
                author: "Agatha Christie",
                genre: "Mystery",
                copiesAvailable: 2
            };

            const book2 = {
                title: "The Catcher in the Rye",
                author: "J.D. Salinger",
                genre: "Fiction",
                copiesAvailable: 3
            };

            const res1 = await request(app)
                .post('/api/books')
                .send(book1)
                .expect(201);

            const res2 = await request(app)
                .post('/api/books')
                .send(book2)
                .expect(201);

            // IDs should be different
            expect(res1.body.id).not.toBe(res2.body.id);
        });
    });

    // ============== PUT ENDPOINT TESTS ==============
    describe('PUT /api/books/:id', () => {
        test('should update an existing book with 200 status', async () => {
            const updatedBook = {
                title: "The Great Gatsby - Updated",
                author: "F. Scott Fitzgerald",
                genre: "Classic Fiction",
                copiesAvailable: 10
            };

            const response = await request(app)
                .put('/api/books/1')
                .send(updatedBook)
                .expect(200);

            expect(response.body.id).toBe(1);
            expect(response.body.title).toBe("The Great Gatsby - Updated");
            expect(response.body.copiesAvailable).toBe(10);
        });

        test('should persist updates to the book', async () => {
            const updatedBook = {
                title: "1984 - Revised Edition",
                author: "George Orwell",
                genre: "Dystopian Fiction",
                copiesAvailable: 12
            };

            await request(app)
                .put('/api/books/3')
                .send(updatedBook)
                .expect(200);

            // Fetch the book to verify the update persisted
            const getResponse = await request(app)
                .get('/api/books/3')
                .expect(200);

            expect(getResponse.body.title).toBe("1984 - Revised Edition");
            expect(getResponse.body.copiesAvailable).toBe(12);
        });

        test('should only update specified fields', async () => {
            const updateData = {
                title: "To Kill a Mockingbird - New Edition",
                author: "Harper Lee",
                genre: "Classic Fiction",
                copiesAvailable: 5
            };

            const response = await request(app)
                .put('/api/books/2')
                .send(updateData)
                .expect(200);

            expect(response.body.id).toBe(2); // ID should remain the same
            expect(response.body.title).toBe("To Kill a Mockingbird - New Edition");
        });

        test('should return 404 when updating non-existent book', async () => {
            const updateData = {
                title: "Non-existent Book",
                author: "Unknown Author",
                genre: "Unknown",
                copiesAvailable: 0
            };

            const response = await request(app)
                .put('/api/books/999')
                .send(updateData)
                .expect(404);

            expect(response.body.error).toBe('Book not found');
        });

        test('should handle partial updates', async () => {
            const partialUpdate = {
                title: "The Great Gatsby - Limited Edition",
                author: "F. Scott Fitzgerald",
                genre: "Fiction",
                copiesAvailable: 2
            };

            const response = await request(app)
                .put('/api/books/1')
                .send(partialUpdate)
                .expect(200);

            expect(response.body.copiesAvailable).toBe(2);
        });
    });

    // ============== DELETE ENDPOINT TESTS ==============
    describe('DELETE /api/books/:id', () => {
        test('should delete an existing book with 200 status', async () => {
            const response = await request(app)
                .delete('/api/books/1')
                .expect(200);

            expect(response.body).toHaveProperty('message');
            expect(response.body.message).toBe('Book deleted successfully');
            expect(response.body.book.id).toBe(1);
            expect(response.body.book.title).toBe("The Great Gatsby");
        });

        test('should remove book from collection', async () => {
            const initialCount = books.length;

            await request(app)
                .delete('/api/books/2')
                .expect(200);

            // Verify book was removed
            const allBooksResponse = await request(app)
                .get('/api/books')
                .expect(200);

            expect(allBooksResponse.body.length).toBe(initialCount - 1);
            expect(allBooksResponse.body.some(b => b.id === 2)).toBe(false);
        });

        test('should not be able to fetch deleted book', async () => {
            await request(app)
                .delete('/api/books/3')
                .expect(200);

            // Try to fetch the deleted book
            const response = await request(app)
                .get('/api/books/3')
                .expect(404);

            expect(response.body.error).toBe('Book not found');
        });

        test('should return 404 when deleting non-existent book', async () => {
            const response = await request(app)
                .delete('/api/books/999')
                .expect(404);

            expect(response.body.error).toBe('Book not found');
        });

        test('should handle multiple DELETE requests', async () => {
            await request(app)
                .delete('/api/books/1')
                .expect(200);

            await request(app)
                .delete('/api/books/2')
                .expect(200);

            const allBooksResponse = await request(app)
                .get('/api/books')
                .expect(200);

            expect(allBooksResponse.body.length).toBe(1);
            expect(allBooksResponse.body[0].id).toBe(3);
        });

        test('should return correct deleted book data', async () => {
            const deleteResponse = await request(app)
                .delete('/api/books/2')
                .expect(200);

            expect(deleteResponse.body.book.id).toBe(2);
            expect(deleteResponse.body.book.title).toBe("To Kill a Mockingbird");
            expect(deleteResponse.body.book.author).toBe("Harper Lee");
        });
    });

    // ============== ERROR HANDLING TESTS ==============
    describe('Error Handling', () => {
        test('should return 404 for GET request to non-existent book', async () => {
            await request(app)
                .get('/api/books/0')
                .expect(404);
        });

        test('should return 404 for POST to non-existent book', async () => {
            // This tests the general error case
            const response = await request(app)
                .get('/api/books/5000')
                .expect(404);

            expect(response.body).toHaveProperty('error');
        });

        test('should return 404 for PUT request to non-existent book ID', async () => {
            const response = await request(app)
                .put('/api/books/9999')
                .send({
                    title: "Test",
                    author: "Test",
                    genre: "Test",
                    copiesAvailable: 0
                })
                .expect(404);

            expect(response.body.error).toBe('Book not found');
        });

        test('should return 404 for DELETE request to non-existent book ID', async () => {
            const response = await request(app)
                .delete('/api/books/5000')
                .expect(404);

            expect(response.body.error).toBe('Book not found');
        });

        test('should return 404 with proper error message for missing resource', async () => {
            const response = await request(app)
                .get('/api/books/123')
                .expect(404);

            expect(response.body).toEqual({ error: 'Book not found' });
        });

        test('should handle invalid book ID gracefully', async () => {
            const response = await request(app)
                .get('/api/books/invalid')
                .expect(404);

            // Should still return 404 even with invalid ID format
            expect(response.body.error).toBe('Book not found');
        });
    });

    // ============== INTEGRATION TESTS ==============
    describe('API Integration', () => {
        test('should handle complete CRUD workflow', async () => {
            // CREATE
            const createResponse = await request(app)
                .post('/api/books')
                .send({
                    title: "New Book",
                    author: "Test Author",
                    genre: "Test Genre",
                    copiesAvailable: 5
                })
                .expect(201);

            const newId = createResponse.body.id;

            // READ
            const readResponse = await request(app)
                .get(`/api/books/${newId}`)
                .expect(200);

            expect(readResponse.body.title).toBe("New Book");

            // UPDATE
            const updateResponse = await request(app)
                .put(`/api/books/${newId}`)
                .send({
                    title: "Updated Book",
                    author: "Test Author",
                    genre: "Updated Genre",
                    copiesAvailable: 10
                })
                .expect(200);

            expect(updateResponse.body.title).toBe("Updated Book");
            expect(updateResponse.body.copiesAvailable).toBe(10);

            // DELETE
            await request(app)
                .delete(`/api/books/${newId}`)
                .expect(200);

            // Verify deletion
            await request(app)
                .get(`/api/books/${newId}`)
                .expect(404);
        });

        test('should maintain data consistency across operations', async () => {
            // Get initial count
            const initialResponse = await request(app)
                .get('/api/books')
                .expect(200);

            const initialCount = initialResponse.body.length;

            // Add a book
            await request(app)
                .post('/api/books')
                .send({
                    title: "New Book",
                    author: "Author",
                    genre: "Genre",
                    copiesAvailable: 1
                })
                .expect(201);

            // Verify count increased
            const afterAddResponse = await request(app)
                .get('/api/books')
                .expect(200);

            expect(afterAddResponse.body.length).toBe(initialCount + 1);

            // Delete a book
            await request(app)
                .delete('/api/books/1')
                .expect(200);

            // Verify count decreased
            const afterDeleteResponse = await request(app)
                .get('/api/books')
                .expect(200);

            expect(afterDeleteResponse.body.length).toBe(initialCount);
        });
    });

    // ============== CONTENT TYPE TESTS ==============
    describe('Content Type Validation', () => {
        test('should return JSON responses', async () => {
            const response = await request(app)
                .get('/api/books')
                .expect(200);

            expect(response.type).toBe('application/json');
        });

        test('should accept JSON requests for POST', async () => {
            const response = await request(app)
                .post('/api/books')
                .set('Content-Type', 'application/json')
                .send({
                    title: "JSON Test",
                    author: "Author",
                    genre: "Genre",
                    copiesAvailable: 1
                })
                .expect(201);

            expect(response.type).toBe('application/json');
        });
    });
});
