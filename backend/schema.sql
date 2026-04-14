-- schema.sql
-- Drop tables if they exist

DROP TABLE IF EXISTS tickets;
DROP TABLE IF EXISTS bus_routes;
DROP TABLE IF EXISTS stops;
DROP TABLE IF EXISTS routes;
DROP TABLE IF EXISTS buses;
DROP TABLE IF EXISTS users;

-- Create tables
CREATE TABLE buses (
    bus_id SERIAL PRIMARY KEY,
    bus_code VARCHAR(20) UNIQUE NOT NULL,
    bus_number VARCHAR(20) UNIQUE NOT NULL,
    depot VARCHAR(50) NOT NULL,
    bus_type VARCHAR(50) DEFAULT 'PALLE VELUGU',
    status VARCHAR(20) DEFAULT 'ACTIVE'
);

CREATE TABLE routes (
    route_id SERIAL PRIMARY KEY,
    route_name VARCHAR(100) NOT NULL,
    start_stop VARCHAR(50) NOT NULL,
    end_stop VARCHAR(50) NOT NULL,
    total_distance NUMERIC
);

CREATE TABLE stops (
    stop_id SERIAL PRIMARY KEY,
    route_id INTEGER REFERENCES routes(route_id) ON DELETE CASCADE,
    stop_name VARCHAR(50) NOT NULL,
    stop_order INTEGER NOT NULL,
    distance_from_start NUMERIC,
    UNIQUE (route_id, stop_order)
);

CREATE TABLE bus_routes (
    id SERIAL PRIMARY KEY,
    bus_id INTEGER REFERENCES buses(bus_id) ON DELETE CASCADE,
    route_id INTEGER REFERENCES routes(route_id) ON DELETE CASCADE,
    UNIQUE (bus_id, route_id)
);

CREATE TABLE users (
    user_id SERIAL PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    phone VARCHAR(20) UNIQUE NOT NULL,
    password_hash VARCHAR(200),
    role VARCHAR(20) DEFAULT 'PASSENGER'
);
INSERT INTO users (name, phone, role) VALUES ('Guest Passenger', '0000000000', 'GUEST');

CREATE TABLE tickets (
    ticket_id SERIAL PRIMARY KEY,
    ticket_uuid UUID NOT NULL UNIQUE,
    user_id INTEGER REFERENCES users(user_id),
    bus_id INTEGER REFERENCES buses(bus_id),
    route_id INTEGER REFERENCES routes(route_id),
    from_stop_id INTEGER REFERENCES stops(stop_id),
    to_stop_id INTEGER REFERENCES stops(stop_id),
    fare NUMERIC NOT NULL,
    issue_time TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    expiry_time TIMESTAMP NOT NULL,
    status VARCHAR(20) DEFAULT 'VALID',
    payment_id VARCHAR(100),
    refund_id VARCHAR(100)
);


-- Insert Routes
INSERT INTO routes (route_name, start_stop, end_stop, total_distance) VALUES
('Visakhapatnam - Vijayawada', 'Visakhapatnam', 'Vijayawada', 350.0),
('Vijayawada - Tirupati', 'Vijayawada', 'Tirupati', 415.0),
('Tirupati - Kurnool', 'Tirupati', 'Kurnool', 340.0),
('Kurnool - Anantapur', 'Kurnool', 'Anantapur', 150.0),
('Ichchapuram - Visakhapatnam', 'Ichchapuram', 'Visakhapatnam', 250.0),
('Guntur - Hyderabad', 'Guntur', 'Hyderabad', 280.0),
('Nellore - Chennai', 'Nellore', 'Chennai', 175.0),
('Kakinada - Visakhapatnam', 'Kakinada', 'Visakhapatnam', 150.0),
('Rajahmundry - Bhadrachalam', 'Rajahmundry', 'Bhadrachalam', 190.0),
('Vijayawada - Bhimavaram', 'Vijayawada', 'Bhimavaram', 120.0),
('Kadapa - Anantapur', 'Kadapa', 'Anantapur', 170.0),
('Ongole - Kurnool', 'Ongole', 'Kurnool', 260.0),
('Tirupati - Bengaluru', 'Tirupati', 'Bengaluru', 250.0),
('Nellore - Kadapa', 'Nellore', 'Kadapa', 180.0),
('Machilipatnam - Hyderabad', 'Machilipatnam', 'Hyderabad', 350.0);

-- Insert Stops
-- Route 1: Visakhapatnam - Vijayawada
INSERT INTO stops (route_id, stop_name, stop_order, distance_from_start) VALUES
(1, 'Visakhapatnam', 1, 0.0), (1, 'Anakapalle', 2, 35.0), (1, 'Tuni', 3, 70.0),
(1, 'Annavaram', 4, 105.0), (1, 'Kakinada Bypass', 5, 140.0), (1, 'Rajahmundry', 6, 175.0),
(1, 'Kovvur', 7, 210.0), (1, 'Tadepalligudem', 8, 245.0), (1, 'Eluru', 9, 280.0),
(1, 'Gannavaram', 10, 315.0), (1, 'Vijayawada', 11, 350.0);

-- Route 2: Vijayawada - Tirupati
INSERT INTO stops (route_id, stop_name, stop_order, distance_from_start) VALUES
(2, 'Vijayawada', 1, 0.0), (2, 'Mangalagiri', 2, 41.5), (2, 'Guntur', 3, 83.0),
(2, 'Chilakaluripet', 4, 124.5), (2, 'Ongole', 5, 166.0), (2, 'Kavali', 6, 207.5),
(2, 'Nellore', 7, 249.0), (2, 'Gudur', 8, 290.5), (2, 'Naidupeta', 9, 332.0),
(2, 'Srikalahasti', 10, 373.5), (2, 'Tirupati', 11, 415.0);

-- Route 3: Tirupati - Kurnool
INSERT INTO stops (route_id, stop_name, stop_order, distance_from_start) VALUES
(3, 'Tirupati', 1, 0.0), (3, 'Chandragiri', 2, 37.8), (3, 'Bhakarapet', 3, 75.6),
(3, 'Pileru', 4, 113.3), (3, 'Rayachoty', 5, 151.1), (3, 'Kadapa', 6, 188.9),
(3, 'Proddatur', 7, 226.7), (3, 'Allagadda', 8, 264.4), (3, 'Nandyal', 9, 302.2),
(3, 'Kurnool', 10, 340.0);

-- Route 4: Kurnool - Anantapur
INSERT INTO stops (route_id, stop_name, stop_order, distance_from_start) VALUES
(4, 'Kurnool', 1, 0.0), (4, 'Veldurthi', 2, 18.8), (4, 'Dhone', 3, 37.5),
(4, 'Peapully', 4, 56.2), (4, 'Gooty', 5, 75.0), (4, 'Guntakal Bypass', 6, 93.8),
(4, 'Pamidi', 7, 112.5), (4, 'Garladinne', 8, 131.2), (4, 'Anantapur', 9, 150.0);

-- Route 5: Ichchapuram - Visakhapatnam
INSERT INTO stops (route_id, stop_name, stop_order, distance_from_start) VALUES
(5, 'Ichchapuram', 1, 0.0), (5, 'Sompeta', 2, 27.8), (5, 'Palasa', 3, 55.6),
(5, 'Tekkali', 4, 83.3), (5, 'Narasannapeta', 5, 111.1), (5, 'Srikakulam', 6, 138.9),
(5, 'Ranasthalam', 7, 166.7), (5, 'Vizianagaram', 8, 194.4), (5, 'Anandapuram', 9, 222.2),
(5, 'Visakhapatnam', 10, 250.0);

-- Route 6: Guntur - Hyderabad
INSERT INTO stops (route_id, stop_name, stop_order, distance_from_start) VALUES
(6, 'Guntur', 1, 0.0), (6, 'Sattenapalli', 2, 31.1), (6, 'Piduguralla', 3, 62.2),
(6, 'Dachepalli', 4, 93.3), (6, 'Miryalaguda', 5, 124.4), (6, 'Nalgonda', 6, 155.6),
(6, 'Narketpalli', 7, 186.7), (6, 'Choutuppal', 8, 217.8), (6, 'LB Nagar', 9, 248.9),
(6, 'Hyderabad', 10, 280.0);

-- Route 7: Nellore - Chennai
INSERT INTO stops (route_id, stop_name, stop_order, distance_from_start) VALUES
(7, 'Nellore', 1, 0.0), (7, 'Venkatachalam', 2, 19.4), (7, 'Gudur', 3, 38.9),
(7, 'Naidupeta', 4, 58.3), (7, 'Doravarisatram', 5, 77.8), (7, 'Sullurpeta', 6, 97.2),
(7, 'Tada', 7, 116.7), (7, 'Gummidipoondi', 8, 136.1), (7, 'Red Hills', 9, 155.6),
(7, 'Chennai', 10, 175.0);

-- Route 8: Kakinada - Visakhapatnam
INSERT INTO stops (route_id, stop_name, stop_order, distance_from_start) VALUES
(8, 'Kakinada', 1, 0.0), (8, 'Pitapuram', 2, 15.0), (8, 'Kathipudi', 3, 30.0),
(8, 'Annavaram', 4, 45.0), (8, 'Tuni', 5, 60.0), (8, 'Payakaraopeta', 6, 75.0),
(8, 'Nakkapalli', 7, 90.0), (8, 'Yelamanchili', 8, 105.0), (8, 'Anakapalle', 9, 120.0),
(8, 'Gajuwaka', 10, 135.0), (8, 'Visakhapatnam', 11, 150.0);

-- Route 9: Rajahmundry - Bhadrachalam
INSERT INTO stops (route_id, stop_name, stop_order, distance_from_start) VALUES
(9, 'Rajahmundry', 1, 0.0), (9, 'Diwancheruvu', 2, 21.1), (9, 'Rajanagaram', 3, 42.2),
(9, 'Jaggampeta', 4, 63.3), (9, 'Gokavaram', 5, 84.4), (9, 'Rampachodavaram', 6, 105.6),
(9, 'Maredumilli', 7, 126.7), (9, 'Chinturu', 8, 147.8), (9, 'Rukkodu', 9, 168.9),
(9, 'Bhadrachalam', 10, 190.0);

-- Route 10: Vijayawada - Bhimavaram
INSERT INTO stops (route_id, stop_name, stop_order, distance_from_start) VALUES
(10, 'Vijayawada', 1, 0.0), (10, 'Kankipadu', 2, 13.3), (10, 'Vuyyuru', 3, 26.7),
(10, 'Pamarru', 4, 40.0), (10, 'Gudivada', 5, 53.3), (10, 'Bantumilli', 6, 66.7),
(10, 'Mudinepalli', 7, 80.0), (10, 'Kaikaluru', 8, 93.3), (10, 'Akividu', 9, 106.7),
(10, 'Bhimavaram', 10, 120.0);

-- Route 11: Kadapa - Anantapur
INSERT INTO stops (route_id, stop_name, stop_order, distance_from_start) VALUES
(11, 'Kadapa', 1, 0.0), (11, 'Pendlimarri', 2, 24.3), (11, 'Vempalli', 3, 48.6),
(11, 'Pulivendula', 4, 72.9), (11, 'Kadiri', 5, 97.1), (11, 'Mudigubba', 6, 121.4),
(11, 'Bathalapalli', 7, 145.7), (11, 'Anantapur', 8, 170.0);

-- Route 12: Ongole - Kurnool
INSERT INTO stops (route_id, stop_name, stop_order, distance_from_start) VALUES
(12, 'Ongole', 1, 0.0), (12, 'Chimakurthy', 2, 28.9), (12, 'Podili', 3, 57.8),
(12, 'Markapuram', 4, 86.7), (12, 'Giddalur', 5, 115.6), (12, 'Cumbum', 6, 144.4),
(12, 'Nandyal', 7, 173.3), (12, 'Panyam', 8, 202.2), (12, 'Orvakal', 9, 231.1),
(12, 'Kurnool', 10, 260.0);

-- Route 13: Tirupati - Bengaluru
INSERT INTO stops (route_id, stop_name, stop_order, distance_from_start) VALUES
(13, 'Tirupati', 1, 0.0), (13, 'Chandragiri', 2, 27.8), (13, 'Chittoor', 3, 55.6),
(13, 'Palamaner', 4, 83.3), (13, 'V Kota', 5, 111.1), (13, 'Mulbagal', 6, 138.9),
(13, 'Kolar', 7, 166.7), (13, 'Hoskote', 8, 194.4), (13, 'KR Puram', 9, 222.2),
(13, 'Bengaluru', 10, 250.0);

-- Route 14: Nellore - Kadapa
INSERT INTO stops (route_id, stop_name, stop_order, distance_from_start) VALUES
(14, 'Nellore', 1, 0.0), (14, 'Podalakur', 2, 25.7), (14, 'Rapur', 3, 51.4),
(14, 'Chitvel', 4, 77.1), (14, 'Rajampet', 5, 102.9), (14, 'Nandalur', 6, 128.6),
(14, 'Vontimitta', 7, 154.3), (14, 'Kadapa', 8, 180.0);

-- Route 15: Machilipatnam - Hyderabad
INSERT INTO stops (route_id, stop_name, stop_order, distance_from_start) VALUES
(15, 'Machilipatnam', 1, 0.0), (15, 'Gudivada', 2, 35.0), (15, 'Pamarru', 3, 70.0),
(15, 'Vijayawada', 4, 105.0), (15, 'Nandigama', 5, 140.0), (15, 'Jaggaiahpet', 6, 175.0),
(15, 'Kodad', 7, 210.0), (15, 'Suryapet', 8, 245.0), (15, 'Nakrekal', 9, 280.0),
(15, 'Choutuppal', 10, 315.0), (15, 'Hyderabad', 11, 350.0);

-- Insert 50 Buses
INSERT INTO buses (bus_code, bus_number, depot, bus_type, status) VALUES
('B001', 'AP26 Z 5468', 'Vijayawada Depot', 'PALLE VELUGU', 'ACTIVE'),
('B002', 'AP31 Z 6902', 'Nellore Depot', 'ULTRA PALLE VELUGU', 'ACTIVE'),
('B003', 'AP37 Z 6745', 'Nellore Depot', 'EXPRESS', 'ACTIVE'),
('B004', 'AP27 Z 1918', 'Kurnool Depot', 'METRO', 'ACTIVE'),
('B005', 'AP33 Z 9934', 'Vijayawada Depot', 'DELUXE', 'ACTIVE'),
('B006', 'AP39 Z 7130', 'Nellore Depot', 'ULTRA DELUXE', 'ACTIVE'),
('B007', 'AP28 Z 8168', 'Nellore Depot', 'PALLE VELUGU', 'ACTIVE'),
('B008', 'AP25 Z 1968', 'Guntur Depot', 'ULTRA PALLE VELUGU', 'ACTIVE'),
('B009', 'AP21 Z 3940', 'Kurnool Depot', 'EXPRESS', 'ACTIVE'),
('B010', 'AP38 Z 5917', 'Anantapur Depot', 'METRO', 'ACTIVE'),
('B011', 'AP26 Z 9263', 'Vizag Depot', 'DELUXE', 'ACTIVE'),
('B012', 'AP24 Z 4966', 'Tirupati Depot', 'ULTRA DELUXE', 'ACTIVE'),
('B013', 'AP12 Z 2253', 'Nellore Depot', 'PALLE VELUGU', 'ACTIVE'),
('B014', 'AP33 Z 9493', 'Vijayawada Depot', 'ULTRA PALLE VELUGU', 'ACTIVE'),
('B015', 'AP28 Z 6673', 'Nellore Depot', 'EXPRESS', 'ACTIVE'),
('B016', 'AP30 Z 1667', 'Nellore Depot', 'METRO', 'ACTIVE'),
('B017', 'AP11 Z 2311', 'Tirupati Depot', 'DELUXE', 'ACTIVE'),
('B018', 'AP19 Z 9081', 'Vijayawada Depot', 'ULTRA DELUXE', 'ACTIVE'),
('B019', 'AP29 Z 9046', 'Kurnool Depot', 'PALLE VELUGU', 'ACTIVE'),
('B020', 'AP16 Z 9713', 'Tirupati Depot', 'ULTRA PALLE VELUGU', 'ACTIVE'),
('B021', 'AP13 Z 3237', 'Kurnool Depot', 'EXPRESS', 'ACTIVE'),
('B022', 'AP12 Z 9345', 'Tirupati Depot', 'METRO', 'ACTIVE'),
('B023', 'AP26 Z 1636', 'Kurnool Depot', 'DELUXE', 'ACTIVE'),
('B024', 'AP34 Z 5991', 'Anantapur Depot', 'ULTRA DELUXE', 'ACTIVE'),
('B025', 'AP13 Z 7311', 'Guntur Depot', 'PALLE VELUGU', 'ACTIVE'),
('B026', 'AP29 Z 3254', 'Vijayawada Depot', 'ULTRA PALLE VELUGU', 'ACTIVE'),
('B027', 'AP23 Z 4536', 'Vizag Depot', 'EXPRESS', 'ACTIVE'),
('B028', 'AP20 Z 3698', 'Nellore Depot', 'METRO', 'ACTIVE'),
('B029', 'AP30 Z 6902', 'Vizag Depot', 'DELUXE', 'ACTIVE'),
('B030', 'AP37 Z 8016', 'Anantapur Depot', 'ULTRA DELUXE', 'ACTIVE'),
('B031', 'AP23 Z 8527', 'Vijayawada Depot', 'PALLE VELUGU', 'ACTIVE'),
('B032', 'AP27 Z 8142', 'Vijayawada Depot', 'ULTRA PALLE VELUGU', 'ACTIVE'),
('B033', 'AP23 Z 4729', 'Vizag Depot', 'EXPRESS', 'ACTIVE'),
('B034', 'AP16 Z 8366', 'Vizag Depot', 'METRO', 'ACTIVE'),
('B035', 'AP22 Z 2154', 'Kurnool Depot', 'DELUXE', 'ACTIVE'),
('B036', 'AP30 Z 2589', 'Tirupati Depot', 'ULTRA DELUXE', 'ACTIVE'),
('B037', 'AP28 Z 4913', 'Guntur Depot', 'PALLE VELUGU', 'ACTIVE'),
('B038', 'AP17 Z 9412', 'Guntur Depot', 'ULTRA PALLE VELUGU', 'ACTIVE'),
('B039', 'AP25 Z 1551', 'Vijayawada Depot', 'EXPRESS', 'ACTIVE'),
('B040', 'AP30 Z 3574', 'Guntur Depot', 'METRO', 'ACTIVE'),
('B041', 'AP35 Z 6874', 'Anantapur Depot', 'DELUXE', 'ACTIVE'),
('B042', 'AP20 Z 1690', 'Tirupati Depot', 'ULTRA DELUXE', 'ACTIVE'),
('B043', 'AP37 Z 8868', 'Anantapur Depot', 'PALLE VELUGU', 'ACTIVE'),
('B044', 'AP18 Z 5969', 'Kurnool Depot', 'ULTRA PALLE VELUGU', 'ACTIVE'),
('B045', 'AP18 Z 7590', 'Anantapur Depot', 'EXPRESS', 'ACTIVE'),
('B046', 'AP18 Z 1638', 'Anantapur Depot', 'METRO', 'ACTIVE'),
('B047', 'AP31 Z 9050', 'Nellore Depot', 'DELUXE', 'ACTIVE'),
('B048', 'AP35 Z 2954', 'Vizag Depot', 'ULTRA DELUXE', 'ACTIVE'),
('B049', 'AP18 Z 9617', 'Guntur Depot', 'PALLE VELUGU', 'ACTIVE'),
('B050', 'AP11 Z 3942', 'Kurnool Depot', 'ULTRA PALLE VELUGU', 'ACTIVE');

-- Map Buses to Routes (Each bus to 1 or 2 routes)
INSERT INTO bus_routes (bus_id, route_id) VALUES
(1, 1), (1, 8), (2, 7), (3, 7), (4, 4), (5, 5), (6, 14), (7, 12), (8, 6), (9, 3),
(10, 11), (11, 1), (12, 13), (13, 2), (14, 10), (14, 15), (15, 14), (16, 7), (17, 3), (18, 2),
(19, 12), (20, 2), (21, 4), (22, 13), (23, 12), (24, 11), (25, 6), (26, 15), (27, 8), (28, 14),
(29, 5), (30, 4), (31, 1), (32, 10), (33, 5), (34, 8), (35, 12), (36, 13), (37, 6), (38, 6),
(39, 10), (40, 15), (41, 11), (42, 3), (43, 4), (44, 3), (45, 11), (46, 4), (47, 7), (48, 8),
(49, 6), (50, 12);
