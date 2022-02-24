package authentication

import (
	"github.com/axyan/countdown-tasks/authentication/src/blacklist"
	"github.com/axyan/countdown-tasks/service"
)

type IAuthenticationService interface {
	service.IService
	Blacklist() *blacklist.BlacklistDB
}

type AuthenticationService struct {
	service.IService
	*blacklist.BlacklistDB
}

func NewAuthenticationService(config service.Config) *AuthenticationService {
	return &AuthenticationService{
		service.NewService("Authentication", config),
		blacklist.NewBlacklistDB(),
	}
}
func (i *AuthenticationService) Blacklist() *blacklist.BlacklistDB {
	return i.BlacklistDB
}
