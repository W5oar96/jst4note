sql, Structed Query Language

DDL, Data Definition Language
DML, Data Manipulation Language
DCL, Data Control Language
DQL, Data Query Language

https://www.runoob.com/sql/sql-syntax.html

SELECT:
SELECT column_name(s) 
FROM table_name
WHERE contion
ORDER BY column_name [ASC|DESC]

INSERT INTO:
INSERT INTO table_name (column1, column2, column3, ...)
VALUES (value1, value2, value3, ...)

UPDATE:
UPDATE table_name
SET column1= value1, column2=value2, ...
WHERE condition

DELETE:
DELETE FROM table_name
WHERE condition

CREATE TABLE:
CREATE TABLE table_name(
    column1 data_type constraint,
    column2 data_type constraint,
    ...
)

ALTER TABLE:
ALTER TABLE table_name
ADD column_name data_type

ALTER TABLE　table_name
DROP COLUMN column_name

DROP TABLE:
DROP TABLE table_name

CREAT INDEX: 
CREAT INDEX index_name
ON table_name (column_name)

DROP INDEX:
DROP INDEX index_name
ON table_name

WHERE:
SELECT column_name(s)
FROM table_name
WHERE condition

ORDER BY:
SELECT column_name(s)
FROM table_name
ORDER BY column_name [ASC|DESC]

GROUP BY:
SELECT column_name(s), aggregate_function(column_name)
FROM table_name
WHERE condition
GROUP BY column_name(s)

HAVING:
SELECT column_name(s), aggregate_function(column_name)
FROM table_name
GROUP BY column_name(s)
HAVING condition

JOIN:
SELECT column_name(s)
FROM table_name1
JOIN tabel_name2
ON table_name1.column_name = table_name2.column_name;

DISTINCT:
SELECT DISTINCT column_name(s)
FROM table_name