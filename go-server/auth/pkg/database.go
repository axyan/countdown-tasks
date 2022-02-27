package auth

import (
	"context"
	"time"

	"github.com/go-redis/redis/v8"
)

type RedisDB struct {
	*redis.Client
}

func NewRedisDB() *RedisDB {
	return &RedisDB{
		redis.NewClient(&redis.Options{
			Addr:     "localhost:6379",
			Password: "password",
			DB:       0,
		})}
}

func (r *RedisDB) Add(token string, expiration uint) error {
	ctx := context.Background()
	if err := r.Set(ctx, token, 0, time.Duration(expiration)*time.Second).Err(); err != nil {
		return err
	}
	return nil
}

func (r *RedisDB) Exists(token string) (bool, error) {
	ctx := context.TODO()
	if _, err := r.Get(ctx, token).Result(); err != nil {
		if err == redis.Nil {
			return false, nil
		}
		return false, err
	}
	return true, nil
}
