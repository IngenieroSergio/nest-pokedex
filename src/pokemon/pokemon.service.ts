import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { isValidObjectId, Model } from 'mongoose';
import { InjectModel } from '@nestjs/mongoose';
import { UpdatePokemonDto } from './dto/update-pokemon.dto';
import { CreatePokemonDto } from './dto/create-pokemon.dto';
import { Pokemon } from './entities/pokemon.entity';
import { ParseMongoIdPipe } from 'src/common/pipes/parse-mongo-id/parse-mongo-id.pipe';
import { PaginationDto } from '../common/dto/pagination.dto';

@Injectable()
export class PokemonService {

  private defaultLimit;

  constructor(
    @InjectModel( Pokemon.name )
    private readonly pokemonModel: Model<Pokemon>,

    private readonly configService: ConfigService
  ){
    this.defaultLimit = configService.get<number>('defaultLimit');
  }
  
  async create(createPokemonDto: CreatePokemonDto) {
    createPokemonDto.name = createPokemonDto.name.toLocaleLowerCase()
    
    try {
      const pokemon = await this.pokemonModel.create( createPokemonDto );
      return pokemon;
      
    } catch (error) {
      this.handleExceptions( error );
    }
  }

  findAll({limit = +this.defaultLimit, offset = 0}: PaginationDto) {
    console.log({limit})
    return this.pokemonModel.find()
    .limit( limit )
    .skip( offset )
    .sort({ no: 1 })
    .select('-__v')
  }

  async findOne(term: string) {
    
    let pokemon;

    if ( !isNaN(+term) ) {
      pokemon = await this.pokemonModel.findOne({ no: term });
    }

    if( !pokemon && isValidObjectId( term ) ){
      pokemon = await this.pokemonModel.findById( term )
    }

    if( !pokemon ){
      pokemon = await this.pokemonModel.findOne({ name: term.toLocaleLowerCase().trim() })
    }
    
    if( !pokemon ) throw new NotFoundException(`Pokemon with id, name or ${term} not found`)
    return pokemon;
  }

  async update(term: string, updatePokemonDto: UpdatePokemonDto) {

    const pokemon = await this.findOne( term );
    if ( updatePokemonDto.name )
      updatePokemonDto.name = updatePokemonDto.name.toLowerCase();
    
    try {
      await pokemon.updateOne( updatePokemonDto );
      return { ...pokemon.toJSON(), ...updatePokemonDto };
      
    } catch (error) {
      this.handleExceptions( error );
    }
  }

  async remove(id: ParseMongoIdPipe) {
    // const pokemon = await this.findOne( id )
    // await pokemon.deleteOne(pokemon);
    const { deletedCount } = await this.pokemonModel.deleteOne({ _id: id })

    if(deletedCount === 0)
      throw new NotFoundException(`Pokemon with id ${ id } not found`)

    return;
  }

  private handleExceptions( error: any ){
    if( error.code === 11000 )
      throw new BadRequestException(`Pokemon exist in db ${ JSON.stringify( error.keyValue ) }`)

    console.log( error )
    throw new BadRequestException(`Can't request pokemon - check server logs`);
  }
}
