package user

import "database/sql"

func (u *UserService) AddUserToDB(email string, hashedPassword []byte) error {
	statement := "INSERT INTO users (email, password) VALUES ($1, $2);"
	_, err := u.Database().Exec(statement, email, hashedPassword)
	if err != nil {
		return err
	}
	return nil
}
func (u *UserService) UpdateUserInDB(id uint) error {
	// TODO
	return nil
}

func (u *UserService) DeleteUserFromDB(id uint) error {
	statement := "DELETE FROM users WHERE id = $1;"
	_, err := u.Database().Exec(statement, id)
	if err != nil {
		return err
	}
	return nil
}

// EmailExists checks if email exists in database
func (u *UserService) EmailExists(email string) (bool, error) {
	var emailExists string
	query := "SELECT email FROM users WHERE email = $1;"
	if err := u.Database().QueryRow(query, email).Scan(&emailExists); err != nil {
		if err == sql.ErrNoRows {
			return false, nil
		}
		return false, err
	}
	return true, nil
}
