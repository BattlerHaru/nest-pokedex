import { BadRequestException, Injectable, InternalServerErrorException, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { ConfigService } from '@nestjs/config';
import { Model, isValidObjectId } from 'mongoose';
import { CreatePokemonDto } from './dto/create-pokemon.dto';
import { UpdatePokemonDto } from './dto/update-pokemon.dto';
import { Pokemon } from './entities/pokemon.entity';
import { PaginationDto } from 'src/common/dto/pagination.dto';

@Injectable()
export class PokemonService {
  private default_limit: number;

  constructor(
    @InjectModel(Pokemon.name)
    private readonly pokemonModel: Model<Pokemon>,


    private readonly configService: ConfigService
  ) {
    this.default_limit = configService.getOrThrow<number>('default_limit');
  }



  async create(createPokemonDto: CreatePokemonDto) {
    createPokemonDto.name = createPokemonDto.name.toLowerCase();
    const { name, no } = createPokemonDto;

    try {
      const newPokemon = await this.pokemonModel.create({
        name, no
      })

      return newPokemon;
    } catch (error) {
      this.handleExceptions(error, "create");
    }
  }

  async findAll(paginationDto: PaginationDto) {


    const { limit = this.default_limit, offset = 0 } = paginationDto;



    const pokemon = await this.pokemonModel
      .find()
      .sort({
        no: 1
      })
      .select('-__v')
      .limit(limit)
      .skip(offset);

    if (pokemon.length < 1) {
      throw new NotFoundException(`Pokemon not founds`)
    }

    return pokemon;
  }

  async findOne(term: string) {
    let found = false;
    let pokemon: Pokemon;

    if (!found && !isNaN(+term)) {
      pokemon = await this.pokemonModel.findOne({ no: term })
      found = true;
    }

    if (!found && isValidObjectId(term)) {
      pokemon = await this.pokemonModel.findById((term))
      found = true;
    }

    if (!found) {
      pokemon = await this.pokemonModel.findOne({ name: term.toLowerCase().trim() })
      found = true;
    }

    if (!pokemon) {
      throw new NotFoundException(`Pokemon with term "${term}" not found`)
    }

    return pokemon;
  }

  async update(term: string, updatePokemonDto: UpdatePokemonDto) {
    const pokemon = await this.findOne(term);

    if (updatePokemonDto.name) {
      updatePokemonDto.name = updatePokemonDto.name.toLowerCase();
    }

    try {
      await pokemon.updateOne(updatePokemonDto)

      return { ...pokemon.toJSON(), ...updatePokemonDto };
    } catch (error) {
      this.handleExceptions(error, "update");
    }
  }

  async remove(id: string) {
    // const pokemon = await this.findOne(term);
    // await pokemon.deleteOne();
    // return `This action remove a #${term} pokemon`;

    // const res = await this.pokemonModel.findByIdAndDelete(id);

    const { deletedCount } = await this.pokemonModel.deleteOne({ _id: id })

    if (deletedCount === 0) {
      throw new BadRequestException(`Pokemon with id "${id}" not found`)
    }

    return `Pokemon with id "${id}" delete success`;
  }

  private handleExceptions(error: any, type?: string) {
    if (error.code === 11000) {
      throw new BadRequestException(`Pokemon exist in db ${JSON.stringify(error.keyValue)}`)
    }

    throw new InternalServerErrorException(`Can't ${type ? type + "pokemon" : 'process'} - Check server logs`)
  }
}
