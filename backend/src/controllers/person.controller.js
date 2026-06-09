const personService = require('../services/person.service');

async function getActor(req, res, next) {
  try {
    const data = await personService.getActorById(Number(req.params.id));
    res.json({ success: true, data });
  } catch (error) {
    next(error);
  }
}

module.exports = {
  getActor
};
