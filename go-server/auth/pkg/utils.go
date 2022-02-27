package auth

import (
	"fmt"
	"time"

	"github.com/golang-jwt/jwt/v4"
)

type Claims struct {
	UserID string
	jwt.RegisteredClaims
}

var ultrasupersecret = []byte("password")

func generateToken(userId string) (string, error) {
	token := jwt.NewWithClaims(jwt.SigningMethodHS256, Claims{
		userId,
		jwt.RegisteredClaims{
			ExpiresAt: jwt.NewNumericDate(time.Now().Add(time.Duration(3600) * time.Second)),
		},
	})

	signedToken, err := token.SignedString(ultrasupersecret)
	if err != nil {
		return "", err
	}
	return signedToken, nil
}

func (a *AuthService) Validate(token string) (string, error) {
	parsedToken, err := jwt.Parse(token, func(token *jwt.Token) (interface{}, error) {
		if _, ok := token.Method.(*jwt.SigningMethodHMAC); !ok {
			return nil, fmt.Errorf("unexpected signing method %v", token.Header["alg"])
		}
		return ultrasupersecret, nil
	})
	if err != nil {
		return "false", err
	}

	if _, ok := parsedToken.Claims.(jwt.MapClaims); !ok || !parsedToken.Valid {
		return "false", nil
	}

	blacklisted, err := a.Blacklist().Exists(token)
	if err != nil {
		return "false", err
	} else if blacklisted {
		return "false", nil
	}

	return "true", nil
}
