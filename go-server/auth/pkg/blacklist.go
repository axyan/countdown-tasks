package auth

type IBlacklistDB interface {
	Add(token string) error
	Exists(token string) (bool, error)
}

type BlacklistDB struct {
	*RedisDB
}

func NewBlacklistDB() *BlacklistDB {
	return &BlacklistDB{
		NewRedisDB(),
	}
}
