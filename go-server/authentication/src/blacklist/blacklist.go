package blacklist

import "github.com/go-redis/redis/v8"

type IBlacklistDB interface {
	Add(token string) error
	Exists(token string) (bool, error)
}

type BlacklistDB struct {
	*redisDB
}

type redisDB struct {
	*redis.Client
}

func NewBlacklistDB() *BlacklistDB {
	return &BlacklistDB{
		newRedisDB(),
	}
}

func newRedisDB() *redisDB {
	return &redisDB{
		redis.NewClient(&redis.Options{
			Addr:     "localhost:6379",
			Password: "password",
			DB:       0,
		})}

}

func (r *redisDB) Add(token string) error {
	//TODO
	return nil
}

func (r *redisDB) Exists(token string) (bool, error) {
	//TODO
	return false, nil
}
