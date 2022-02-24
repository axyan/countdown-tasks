package user

import (
	"database/sql"
	"errors"
	"html"
	"net/mail"
	"strings"
	"time"

	"github.com/golang-jwt/jwt/v4"
	"golang.org/x/crypto/bcrypt"
)

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

// Sanitize sanitizes user input for email and password by trimming whitespace
// and escaping characters: <, >, &, ', and "
func (c *Credentials) Sanitize() {
	c.Email = html.EscapeString(strings.TrimSpace(c.Email))
	c.Password = html.EscapeString(strings.TrimSpace(c.Password))
}

// Validate validates user input for email and password to ensure valid
// format and length
func (c Credentials) Validate() error {
	if _, err := mail.ParseAddress(c.Email); err != nil {
		return errors.New("invalid email")
	}

	switch {
	case len(c.Email) == 0:
		return errors.New("email cannot be empty")
	case len(c.Password) == 0:
		return errors.New("password cannot be empty")
	case len(c.Password) <= 8:
		return errors.New("password must be greater than 8 characters")
	}

	if len(c.ConfirmPassword) != 0 && c.ConfirmPassword != c.Password {
		return errors.New("passwords do not match")
	}

	return nil
}

func hashPassword(password string) ([]byte, error) {
	return bcrypt.GenerateFromPassword([]byte(password), 14)
}

func validatePassword(hashedPassword []byte, password string) bool {
	err := bcrypt.CompareHashAndPassword(hashedPassword, []byte(password))
	return err == nil
}

type Claims struct {
	UserID uint
	jwt.RegisteredClaims
}

func generateJWT(userId uint) (string, error) {
	token := jwt.NewWithClaims(jwt.SigningMethodHS256, Claims{
		userId,
		jwt.RegisteredClaims{
			ExpiresAt: jwt.NewNumericDate(time.Now().Add(time.Duration(3600) * time.Second)),
		},
	})

	secret := []byte("secretpassword")
	signedToken, err := token.SignedString(secret)
	if err != nil {
		return "", err
	}
	return signedToken, nil
}
