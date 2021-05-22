# Habit Tracker
<a href="https://github.com/noobj/nest-habit/actions"><img src="https://github.com/noobj/nest-habit/actions/workflows/main.yml/badge.svg" alt="Build Status"></a>
[![Coverage Status](https://coveralls.io/repos/github/noobj/nest-habit/badge.svg?branch=main)](https://coveralls.io/github/noobj/nest-habit?branch=main)
![GitHub](https://img.shields.io/github/license/noobj/nest-habit?color=blue)

* [System requirements](#system-requirements)
* [Installing for dev](#installing-for-dev)
* [License](#license)

## System requirements
* Nodejs 12.0+

## Installing for dev
* cp .env.example .env
* cp ormconfig.env.example ormconfig.env
* fill the connection info of env files
* npm install
* Create new mysql user and database
* npm run migrate
* vendor/bin/sail php artisan db:seed ProjectTableSeeder
* vendor/bin/sail php artisan schedule:FetchAndUpdateThirdParty 10
* vendor/bin/sail php artisan db:seed DatabaseSeeder
* open the page http://127.0.0.1/, and log in using jjj/passowrd

* (If you are using vm or access from the other domain, please put your domain name into SANCTUM_STATEFUL_DOMAINS in the .env, or you won't able to pass the authentication)

<!-- ABOUT THE PROJECT -->
## About The Project

> If you want to stick with a habit for good, one simple and effective thing you can do is keep a habit tracker. (James Clear, "Atomic Habits")

<img src="https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcSbrH0LSIMcdftnQJVqPvQMDbuQGcqHmO-FeA&usqp=CAU">


* Fetch the record from Toggl and insert into DB.
* A github-like activity board to diplay daily summary.

![Display](./display.png)

### Built With

* [NestJS](https://github.com/nestjs/nest)
* [VueJS 2](https://vuejs.org/)
* [Tailwind CSS](https://tailwindcss.com/)


<!-- LICENSE -->
## License

Distributed under the MIT License. See `LICENSE` for more information.
