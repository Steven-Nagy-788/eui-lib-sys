-- Optional: Create a PostgreSQL function for efficient books with stats query
-- This function performs a single JOIN query instead of N+1 queries
-- Run this in your Supabase SQL Editor for better performance

CREATE OR REPLACE FUNCTION get_books_with_stats(
    offset_param INT DEFAULT 0,
    limit_param INT DEFAULT 50
)
RETURNS TABLE (
    id UUID,
    isbn TEXT,
    book_number TEXT,
    call_number TEXT,
    title TEXT,
    author TEXT,
    faculty TEXT,
    publisher TEXT,
    publication_year INT,
    book_pic_url TEXT,
    marc_data JSONB,
    created_at TIMESTAMPTZ,
    copy_stats JSONB
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        b.id,
        b.isbn,
        b.book_number,
        b.call_number,
        b.title,
        b.author,
        b.faculty,
        b.publisher,
        b.publication_year,
        b.book_pic_url,
        b.marc_data,
        b.created_at,
        jsonb_build_object(
            'total', COALESCE(COUNT(bc.id), 0)::INT,
            'available', COALESCE(SUM(CASE WHEN bc.is_reference = false AND bc.status = 'available' THEN 1 ELSE 0 END), 0)::INT,
            'reference', COALESCE(SUM(CASE WHEN bc.is_reference = true THEN 1 ELSE 0 END), 0)::INT,
            'circulating', COALESCE(SUM(CASE WHEN bc.is_reference = false THEN 1 ELSE 0 END), 0)::INT,
            'checked_out', COALESCE(SUM(CASE WHEN bc.status = 'loaned' THEN 1 ELSE 0 END), 0)::INT
        ) as copy_stats
    FROM books b
    LEFT JOIN book_copies bc ON b.id = bc.book_id
    GROUP BY b.id, b.isbn, b.book_number, b.call_number, b.title, b.author, 
             b.faculty, b.publisher, b.publication_year, b.book_pic_url, 
             b.marc_data, b.created_at
    ORDER BY b.created_at DESC
    OFFSET offset_param
    LIMIT limit_param;
END;
$$ LANGUAGE plpgsql;

-- Example usage:
-- SELECT * FROM get_books_with_stats(0, 50);
