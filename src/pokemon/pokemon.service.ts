import { BadRequestException, Injectable, InternalServerErrorException, NotFoundException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { InjectModel } from '@nestjs/mongoose';

import { CreatePokemonDto } from './dto/create-pokemon.dto';
import { UpdatePokemonDto } from './dto/update-pokemon.dto';
import { Model, isValidObjectId } from 'mongoose';
import { Pokemon } from './entities/pokemon.entity';
import { PaginationDto } from 'src/common/dto/pagination.dto';

@Injectable()
export class PokemonService {

  private defaultLimit: number;

  constructor(
    @InjectModel( Pokemon.name )
    private readonly pokemonModel: Model<Pokemon>,

    private readonly configService: ConfigService,
  ){
    this.defaultLimit = this.configService.get<number>('defaultLimit')
    // console.log({var: +process.env.PORT})
  }

  async create(createPokemonDto: CreatePokemonDto) {
    createPokemonDto.name = createPokemonDto.name.toLocaleLowerCase();
    try {
      const pokemon = await this.pokemonModel.create( createPokemonDto );
        return pokemon;

    } catch (error) {
      this.handleExeptions(error);
    }
      
  }

  findAll(paginationDto: PaginationDto) {
    const {limit = this.defaultLimit, offSet = 0} = paginationDto
    return this.pokemonModel.find()
    .limit(limit)
    .skip(offSet)
    .sort({
      no: 1
    })
    .select('-__v');
  }

  async findOne(term: string) {
    let pokemon: Pokemon

    if( !isNaN(+term) ){
      pokemon = await this.pokemonModel.findOne({ no: term })
    }

    //MongoID
    if( !pokemon && isValidObjectId( term ) ){
      pokemon = await this.pokemonModel.findById( term )

    }

    // Name
    if ( !pokemon ) {
    pokemon = await this.pokemonModel.findOne({ name: term.toLowerCase().trim() })
    }

    if ( !pokemon ) 
      throw new NotFoundException(`Pokemon with id, name or no "${ term }" not found`);
    
    return pokemon;

  }

  async update(term: string, updatePokemonDto: UpdatePokemonDto) {
    const pokemon = await this.findOne( term );
    if( updatePokemonDto.name ) 
    updatePokemonDto.name = updatePokemonDto.name.toLowerCase();

    try {
      await pokemon.updateOne( updatePokemonDto )
      return {...pokemon.toJSON(), ...updatePokemonDto};

    } catch (error) {
      this.handleExeptions(error);
    }
    
  }

  async remove(id: string) {
    // const pokemon = await this.findOne( id );
    // await pokemon.deleteOne();
    const { deletedCount } = await this.pokemonModel.deleteOne({ _id: id })
    if( deletedCount === 0 ){
      throw new BadRequestException(`Pokemon whit id "${ id }" not found`)
    }
  }

  private handleExeptions(error: any){
    if( error.code === 11000){
      throw new BadRequestException(`Pokemon exits in db ${JSON.stringify( error.keyValue )}`)
    }
    console.log(error)
    throw new InternalServerErrorException(`Can't create pokemon - Check server logs`)
  }
}
