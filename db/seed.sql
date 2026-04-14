-- Initial data to test the system
INSERT INTO problems (title, description, difficulty) 
VALUES ('Square It', 'Read an integer n from standard input and print its square.', 'Easy');

INSERT INTO test_cases (problem_id, input_data, expected_output) 
VALUES 
(1, '5', '25'),
(1, '10', '100'),
(1, '-3', '9');
