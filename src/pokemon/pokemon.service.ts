import { BadRequestException, Injectable, InternalServerErrorException, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, isValidObjectId } from 'mongoose';
import { CreatePokemonDto } from './dto/create-pokemon.dto';
import { UpdatePokemonDto } from './dto/update-pokemon.dto';
import { Pokemon } from './entities/pokemon.entity';

@Injectable()
export class PokemonService {

  constructor(
    @InjectModel(Pokemon.name)
    private readonly pokemonModel: Model<Pokemon>
  ) { }



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

  findAll() {
    return `This action returns all pokemon`;
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

  remove(id: number) {
    return `This action removes a #${id} pokemon`;
  }

  private handleExceptions(error: any, type?: string) {
    if (error.code === 11000) {
      throw new BadRequestException(`Pokemon exist in db ${JSON.stringify(error.keyValue)}`)
    }

    throw new InternalServerErrorException(`Can't ${type ? type + "pokemon" : 'process'} - Check server logs`)
  }
}
