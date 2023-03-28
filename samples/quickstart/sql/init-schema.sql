/*
 * Copyright (c) 2020, 2023, Oracle and/or its affiliates.
 * Licensed under the Universal Permissive License v 1.0 as shown at https://oss.oracle.com/licenses/upl.
 */
CREATE TABLE ToDos (taskId INT NOT NULL AUTO_INCREMENT,
                    task VARCHAR(200) NOT NULL,
                    completed BOOLEAN,
                    constraint todo_pk PRIMARY KEY (taskId));
INSERT INTO ToDos (task, completed)
VALUES
    ('Install WKTUI', FALSE),
    ('Install Verrazzano', FALSE),
    ('Move ToDo List to the the cloud', FALSE),
    ('Celebrate', FALSE),
    ('Clean off my desk', FALSE);
