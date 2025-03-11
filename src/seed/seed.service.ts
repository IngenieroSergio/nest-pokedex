import { Injectable } from '@nestjs/common';
import { PokeResponse } from './interfaces/poke-response.interface';
import axios, { AxiosInstance } from 'axios';
import { Model } from 'mongoose';
import { Pokemon } from 'src/pokemon/entities/pokemon.entity';
import { InjectModel } from '@nestjs/mongoose';
import { AxiosAdapter } from 'src/common/adapters/axios.adapter';


@Injectable()
export class SeedService {

  constructor(
    @InjectModel( Pokemon.name )
    private readonly pokemonModule: Model<Pokemon>,
    private readonly http: AxiosAdapter,
  ){}

  async executeSeed() {

    await this.pokemonModule.deleteMany({})
    const data = await this.http.get<PokeResponse>('https://pokeapi.co/api/v2/pokemon?limit=650') 

    const pokemonToInsert: { name:string, no: number }[] = [];

    data.results.forEach(async ({name, url }) => {

      const segments = url.split('/');
      const no = +segments[segments.length-2]

      pokemonToInsert.push({ name, no})
       
    } )
    await this.pokemonModule.insertMany( pokemonToInsert )
    
    return 'Seed executed succesfull '
  }

}