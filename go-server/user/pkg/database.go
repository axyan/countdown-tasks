package user

import (
	"database/sql"

	"github.com/google/uuid"
)

// AddUserToDB adds a new user into the database
func (u *UserService) AddUserToDB(email string, hashedPassword []byte) error {
	statement := "INSERT INTO users (email, password) VALUES ($1, $2);"
	_, err := u.Database().Exec(statement, email, hashedPassword)
	if err != nil {
		return err
	}
	return nil
}

// UpdateUserInDB updates a user's info in the database
func (u *UserService) UpdateUserInDB(id uuid.UUID) error {
	// TODO
	return nil
}

// DeleteUserFromDB deletes a user from the database
func (u *UserService) DeleteUserFromDB(id string) error {
	idUUID, err := uuid.Parse(id)
	if err != nil {
		return err
	}
	statement := "DELETE FROM users WHERE id = $1;"
	_, err = u.Database().Exec(statement, idUUID)
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

func (u *UserService) ValidateLogin(email string, unhashedPassword string) (string, error) {
	var user struct {
		id       string
		email    string
		password []byte
	}
	query := "SELECT id, email, password FROM users WHERE email = $1;"
	if err := u.Database().QueryRow(query, email).Scan(&user.id, &user.email, &user.password); err != nil {
		if err == sql.ErrNoRows {
			return "", nil
		}
		return "", err
	}

	isMatch := validatePassword(user.password, unhashedPassword)
	if !isMatch {
		return "", nil
	}
	return user.id, nil
}
